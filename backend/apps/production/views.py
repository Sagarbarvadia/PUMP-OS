from decimal import Decimal
from django.db import transaction
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

from .models import ProductionOrder, ProductionMaterialUsage
from .serializers import ProductionOrderSerializer, ProductionOrderListSerializer
from apps.bom.models import BOM
from apps.master.models import RawMaterial
from apps.inventory.models import StockLedger, FinishedGoodsStock, ScrapStock


def generate_order_no():
    from datetime import date
    today = date.today()
    prefix = f"PO-{today.strftime('%Y%m%d')}"
    last = ProductionOrder.objects.filter(order_no__startswith=prefix).order_by('-order_no').first()
    if last:
        try:
            seq = int(last.order_no.split('-')[-1]) + 1
        except (ValueError, IndexError):
            seq = 1
    else:
        seq = 1
    return f"{prefix}-{seq:03d}"


class ProductionOrderListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        orders = ProductionOrder.objects.select_related('product_model', 'created_by').all()
        status_filter = request.query_params.get('status')
        model_id = request.query_params.get('model')
        date_from = request.query_params.get('from')
        date_to = request.query_params.get('to')
        if status_filter:
            orders = orders.filter(status=status_filter)
        if model_id:
            orders = orders.filter(product_model_id=model_id)
        if date_from:
            orders = orders.filter(date__gte=date_from)
        if date_to:
            orders = orders.filter(date__lte=date_to)
        return Response(ProductionOrderListSerializer(orders, many=True).data)

    def post(self, request):
        if request.user.role not in ['ADMIN', 'PRODUCTION_MANAGER', 'STORE_MANAGER']:
            return Response({'error': 'Permission denied'}, status=403)

        data = request.data
        product_model_id = data.get('product_model')
        qty_planned = Decimal(str(data.get('qty_planned', 0)))
        qty_produced = Decimal(str(data.get('qty_produced', 0)))
        qty_rejected = Decimal(str(data.get('qty_rejected', 0)))

        if qty_produced < 0 or qty_rejected < 0:
            return Response({'error': 'Quantities cannot be negative'}, status=400)
        if qty_produced < qty_rejected:
            return Response({'error': 'Rejected qty cannot exceed produced qty'}, status=400)

        # Get active BOM
        bom = BOM.objects.filter(product_model_id=product_model_id, is_active=True).prefetch_related(
            'items__raw_material'
        ).first()
        if not bom:
            return Response({'error': 'No active BOM found for this product model'}, status=400)

        bom_items = list(bom.items.select_related('raw_material').all())

        # Pre-check stock availability
        if qty_produced > 0:
            for item in bom_items:
                effective_qty = item.qty_per_unit * qty_produced * (1 + item.scrap_percent / 100)
                effective_qty = round(effective_qty, 4)
                if item.raw_material.current_stock < effective_qty:
                    return Response({
                        'error': f'Insufficient stock for "{item.raw_material.item_name}". '
                                 f'Required: {effective_qty}, Available: {item.raw_material.current_stock}'
                    }, status=400)

        with transaction.atomic():
            order_no = data.get('order_no') or generate_order_no()
            order = ProductionOrder.objects.create(
                order_no=order_no,
                date=data.get('date'),
                product_model_id=product_model_id,
                qty_planned=qty_planned,
                qty_produced=qty_produced,
                qty_rejected=qty_rejected,
                batch_no=data.get('batch_no', order_no),
                status='COMPLETED' if qty_produced > 0 else 'PLANNED',
                notes=data.get('notes', ''),
                created_by=request.user
            )

            total_cost = Decimal('0')

            if qty_produced > 0:
                for item in bom_items:
                    effective_qty = item.qty_per_unit * qty_produced * (1 + item.scrap_percent / 100)
                    effective_qty = round(effective_qty, 4)

                    material = RawMaterial.objects.select_for_update().get(pk=item.raw_material_id)
                    rate = material.moving_avg_cost if material.moving_avg_cost > 0 else material.default_cost
                    item_cost = round(Decimal(str(effective_qty)) * rate, 4)
                    total_cost += item_cost

                    material.current_stock = round(material.current_stock - Decimal(str(effective_qty)), 4)
                    material.save()

                    StockLedger.objects.create(
                        raw_material=material,
                        transaction_type='PRODUCTION',
                        quantity=-Decimal(str(effective_qty)),
                        rate=rate,
                        value=-item_cost,
                        balance_qty=material.current_stock,
                        balance_value=material.current_stock * material.moving_avg_cost,
                        reference_no=order.order_no,
                        notes=f"Production: {order.order_no}",
                        created_by=request.user
                    )

                    ProductionMaterialUsage.objects.create(
                        production_order=order,
                        raw_material=material,
                        qty_used=Decimal(str(effective_qty)),
                        rate=rate,
                        cost=item_cost
                    )

                # Add finished goods
                net_produced = qty_produced - qty_rejected
                if net_produced > 0:
                    FinishedGoodsStock.objects.create(
                        product_model_id=product_model_id,
                        quantity=net_produced,
                        batch_no=order.batch_no,
                        production_order=order
                    )

                # Add scrap
                if qty_rejected > 0:
                    ScrapStock.objects.create(
                        product_model_id=product_model_id,
                        quantity=qty_rejected,
                        batch_no=order.batch_no,
                        production_order=order,
                        notes=f"Rejected from {order.order_no}"
                    )

                cost_per_unit = total_cost / qty_produced if qty_produced > 0 else Decimal('0')
                order.batch_cost = total_cost
                order.cost_per_unit = round(cost_per_unit, 4)
                order.save()

        return Response(ProductionOrderSerializer(order).data, status=201)


class ProductionOrderDetailView(APIView):
    permission_classes = [IsAuthenticated]
    def put(self, request, pk):

        if request.user.role not in ['ADMIN', 'STORE_MANAGER']:
            return Response({'error': 'Permission denied'}, status=403)

        try:
            order = ProductionOrder.objects.prefetch_related(
                'material_usage__raw_material'
            ).get(pk=pk)
        except ProductionOrder.DoesNotExist:
            return Response({'error': 'Order not found'}, status=404)

        data = request.data

        qty_planned = Decimal(str(data.get('qty_planned', order.qty_planned)))
        qty_produced = Decimal(str(data.get('qty_produced', order.qty_produced)))
        qty_rejected = Decimal(str(data.get('qty_rejected', order.qty_rejected)))
        product_model_id = data.get('product_model', order.product_model_id)

        if qty_rejected > qty_produced:
            return Response(
                {'error': 'Rejected qty cannot exceed produced qty'},
                status=400
            )

        # get BOM
        bom = BOM.objects.filter(
            product_model_id=product_model_id,
            is_active=True
        ).prefetch_related('items__raw_material').first()

        if not bom:
            return Response({'error': 'No active BOM found'}, status=400)

        bom_items = list(bom.items.select_related('raw_material').all())

        with transaction.atomic():

            # --------------------------
            # 1️⃣ RESTORE OLD MATERIALS
            # --------------------------
            for usage in order.material_usage.all():

                material = RawMaterial.objects.select_for_update().get(
                    pk=usage.raw_material_id
                )

                material.current_stock += usage.qty_used
                material.save()

            # --------------------------
            # 2️⃣ DELETE OLD RECORDS
            # --------------------------
            order.material_usage.all().delete()

            FinishedGoodsStock.objects.filter(
                production_order=order
            ).delete()

            ScrapStock.objects.filter(
                production_order=order
            ).delete()

            # --------------------------
            # 3️⃣ UPDATE ORDER
            # --------------------------
            order.date = data.get('date', order.date)
            order.product_model_id = product_model_id
            order.qty_planned = qty_planned
            order.qty_produced = qty_produced
            order.qty_rejected = qty_rejected
            order.batch_no = data.get('batch_no', order.batch_no)
            order.notes = data.get('notes', order.notes)

            total_cost = Decimal('0')

            # --------------------------
            # 4️⃣ APPLY NEW BOM
            # --------------------------
            if qty_produced > 0:

                for item in bom_items:

                    effective_qty = item.qty_per_unit * qty_produced * (1 + item.scrap_percent / 100)
                    effective_qty = round(effective_qty, 4)

                    material = RawMaterial.objects.select_for_update().get(
                        pk=item.raw_material_id
                    )

                    rate = material.moving_avg_cost if material.moving_avg_cost > 0 else material.default_cost

                    item_cost = Decimal(str(effective_qty)) * rate
                    total_cost += item_cost

                    material.current_stock -= Decimal(str(effective_qty))
                    material.save()

                    ProductionMaterialUsage.objects.create(
                        production_order=order,
                        raw_material=material,
                        qty_used=Decimal(str(effective_qty)),
                        rate=rate,
                        cost=item_cost
                    )

            # --------------------------
            # 5️⃣ ADD FINISHED GOODS
            # --------------------------
            net_produced = qty_produced - qty_rejected

            if net_produced > 0:

                FinishedGoodsStock.objects.create(
                    product_model_id=product_model_id,
                    quantity=net_produced,
                    batch_no=order.batch_no,
                    production_order=order
                )

            if qty_rejected > 0:

                ScrapStock.objects.create(
                    product_model_id=product_model_id,
                    quantity=qty_rejected,
                    batch_no=order.batch_no,
                    production_order=order,
                    notes=f"Rejected from {order.order_no}"
                )

            order.batch_cost = total_cost

            if qty_produced > 0:
                order.cost_per_unit = total_cost / qty_produced
            else:
                order.cost_per_unit = Decimal('0')

            order.save()

        return Response(ProductionOrderSerializer(order).data)
    def get_object(self, pk):
        try:
            return ProductionOrder.objects.prefetch_related(
                'material_usage__raw_material', 'product_model'
            ).get(pk=pk)
        except ProductionOrder.DoesNotExist:
            return None

    def get(self, request, pk):
        order = self.get_object(pk)
        if not order:
            return Response({'error': 'Not found'}, status=404)
        return Response(ProductionOrderSerializer(order).data)
    def delete(self, request, pk):

        try:
            order = ProductionOrder.objects.prefetch_related('material_usage__raw_material').get(pk=pk)
        except ProductionOrder.DoesNotExist:
            return Response({"error": "Order not found"}, status=404)

        with transaction.atomic():

            # Restore raw materials
            for usage in order.material_usage.all():
                material = RawMaterial.objects.select_for_update().get(pk=usage.raw_material_id)
                material.current_stock += usage.qty_used
                material.save()

            # Delete usages
            order.material_usage.all().delete()

            # Delete finished goods
            FinishedGoodsStock.objects.filter(production_order=order).delete()

            # Delete scrap
            ScrapStock.objects.filter(production_order=order).delete()

            order.delete()

        return Response({"message": "Production order deleted"})

class TodayProductionView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from datetime import date
        today = date.today()
        orders = ProductionOrder.objects.filter(date=today, status='COMPLETED').select_related('product_model')
        return Response(ProductionOrderListSerializer(orders, many=True).data)
