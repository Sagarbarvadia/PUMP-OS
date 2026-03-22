from datetime import date, timedelta
from django.db.models import Sum, Q, Count, F
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from apps.master.models import RawMaterial, ProductModel
from apps.inventory.models import PurchaseEntry, FinishedGoodsStock, ScrapStock, StockLedger
from apps.production.models import ProductionOrder, ProductionMaterialUsage
from apps.bom.models import BOM


class RawMaterialStockReportView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        items = RawMaterial.objects.filter(status=True)
        category = request.query_params.get('category')
        if category:
            items = items.filter(category=category)

        data = []
        for i in items:
            rate = float(i.moving_avg_cost) if i.moving_avg_cost > 0 else float(i.default_cost)
            data.append({
                'item_id': i.item_id,
                'item_name': i.item_name,
                'category': i.category,
                'unit': i.unit,
                'current_stock': float(i.current_stock),
                'moving_avg_cost': float(i.moving_avg_cost),
                'stock_value': round(float(i.current_stock) * rate, 2),
                'reorder_level': float(i.reorder_level),
                'status': 'BELOW REORDER' if i.current_stock <= i.reorder_level and i.reorder_level > 0 else 'OK'
            })
        total_value = sum(d['stock_value'] for d in data)
        return Response({'items': data, 'total_value': round(total_value, 2)})


class FinishedGoodsReportView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        data = []
        for model in ProductModel.objects.filter(status=True):
            fg = FinishedGoodsStock.objects.filter(product_model=model).aggregate(total=Sum('quantity'))['total'] or 0
            scrap = ScrapStock.objects.filter(product_model=model).aggregate(total=Sum('quantity'))['total'] or 0
            data.append({
                'model_id': model.model_id,
                'model_name': model.model_name,
                'finished_goods': float(fg),
                'scrap': float(scrap),
                'manufacturing_cost': float(model.manufacturing_cost),
                'fg_value': round(float(fg) * float(model.manufacturing_cost), 2)
            })
        return Response(data)


class MonthlyProductionReportView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        year = int(request.query_params.get('year', date.today().year))
        month = int(request.query_params.get('month', date.today().month))
        model_id = request.query_params.get('model')

        from datetime import date as dt
        m_start = dt(year, month, 1)
        if month == 12:
            m_end = dt(year, 12, 31)
        else:
            m_end = dt(year, month + 1, 1) - timedelta(days=1)

        orders = ProductionOrder.objects.filter(date__gte=m_start, date__lte=m_end).select_related('product_model')
        if model_id:
            orders = orders.filter(product_model_id=model_id)

        model_summary = orders.values('product_model').annotate(
            model_id=F('product_model__model_id'),
            model_name=F('product_model__model_name'),
            total_produced=Sum('qty_produced'),
            total_rejected=Sum('qty_rejected'),
            total_cost=Sum('batch_cost'),
            order_count=Count('id')
        )

        result = []
        for item in model_summary:
            result.append({
                'model_id': item['product_model__model_id'],
                'model_name': item['product_model__model_name'],
                'total_produced': float(item['total_produced'] or 0),
                'total_rejected': float(item['total_rejected'] or 0),
                'net_production': float((item['total_produced'] or 0) - (item['total_rejected'] or 0)),
                'total_cost': float(item['total_cost'] or 0),
                'order_count': item['order_count']
            })
        return Response({'month': f"{year}-{month:02d}", 'data': result})


class DailyProductionReportView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        report_date = request.query_params.get('date', date.today().isoformat())
        orders = ProductionOrder.objects.filter(
            date=report_date, status='COMPLETED'
        ).select_related('product_model')
        data = []
        for o in orders:
            data.append({
                'order_no': o.order_no,
                'model': o.product_model.model_name,
                'batch_no': o.batch_no,
                'qty_produced': float(o.qty_produced),
                'qty_rejected': float(o.qty_rejected),
                'net': float(o.qty_produced - o.qty_rejected),
                'batch_cost': float(o.batch_cost),
                'cost_per_unit': float(o.cost_per_unit)
            })
        totals = {
            'produced': sum(d['qty_produced'] for d in data),
            'rejected': sum(d['qty_rejected'] for d in data),
            'net': sum(d['net'] for d in data),
        }
        return Response({'date': report_date, 'orders': data, 'totals': totals})


class BOMCostReportView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        model_id = request.query_params.get('model')
        if not model_id:
            return Response({'error': 'model parameter required'}, status=400)
        try:
            model = ProductModel.objects.get(pk=model_id)
        except ProductModel.DoesNotExist:
            return Response({'error': 'Model not found'}, status=404)

        bom = BOM.objects.filter(product_model=model, is_active=True).prefetch_related(
            'items__raw_material'
        ).first()
        if not bom:
            return Response({'error': 'No active BOM found'}, status=404)

        items = []
        for item in bom.items.all():
            rate = float(item.raw_material.moving_avg_cost) if item.raw_material.moving_avg_cost > 0 else float(item.raw_material.default_cost)
            eff_qty = float(item.qty_per_unit) * (1 + float(item.scrap_percent) / 100)
            line_cost = round(eff_qty * rate, 4)
            items.append({
                'item_id': item.raw_material.item_id,
                'item_name': item.raw_material.item_name,
                'unit': item.raw_material.unit,
                'qty_per_unit': float(item.qty_per_unit),
                'scrap_percent': float(item.scrap_percent),
                'effective_qty': round(eff_qty, 4),
                'rate': round(rate, 4),
                'line_cost': line_cost,
                'process_stage': item.process_stage
            })

        return Response({
            'model_id': model.model_id,
            'model_name': model.model_name,
            'total_cost': float(bom.total_cost),
            'items': sorted(items, key=lambda x: x['line_cost'], reverse=True)
        })


class WastageReportView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        date_from = request.query_params.get('from', (date.today().replace(day=1)).isoformat())
        date_to = request.query_params.get('to', date.today().isoformat())

        scrap = ScrapStock.objects.filter(
            created_at__date__gte=date_from, created_at__date__lte=date_to
        ).values('product_model__model_name').annotate(total=Sum('quantity'))

        rejected_orders = ProductionOrder.objects.filter(
            date__gte=date_from, date__lte=date_to, status='COMPLETED', qty_rejected__gt=0
        ).select_related('product_model')

        total_produced = ProductionOrder.objects.filter(
            date__gte=date_from, date__lte=date_to, status='COMPLETED'
        ).aggregate(t=Sum('qty_produced'))['t'] or 0

        total_rejected = ProductionOrder.objects.filter(
            date__gte=date_from, date__lte=date_to, status='COMPLETED'
        ).aggregate(t=Sum('qty_rejected'))['t'] or 0

        wastage_pct = (float(total_rejected) / float(total_produced) * 100) if total_produced > 0 else 0

        return Response({
            'period': {'from': date_from, 'to': date_to},
            'total_produced': float(total_produced),
            'total_rejected': float(total_rejected),
            'wastage_percent': round(wastage_pct, 2),
            'scrap_by_model': list(scrap)
        })


class ReorderReportView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        items = RawMaterial.objects.filter(status=True, reorder_level__gt=0)
        critical = [i for i in items if i.current_stock <= i.reorder_level]
        data = [{
            'item_id': i.item_id,
            'item_name': i.item_name,
            'category': i.category,
            'unit': i.unit,
            'current_stock': float(i.current_stock),
            'reorder_level': float(i.reorder_level),
            'shortage': round(float(i.reorder_level) - float(i.current_stock), 4),
            'lead_time_days': i.lead_time,
            'default_cost': float(i.default_cost)
        } for i in critical]
        return Response(sorted(data, key=lambda x: x['shortage'], reverse=True))


class StockMovementReportView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        item_id = request.query_params.get('item')
        date_from = request.query_params.get('from')
        date_to = request.query_params.get('to')

        entries = StockLedger.objects.select_related('raw_material').all()
        if item_id:
            entries = entries.filter(raw_material_id=item_id)
        if date_from:
            entries = entries.filter(created_at__date__gte=date_from)
        if date_to:
            entries = entries.filter(created_at__date__lte=date_to)
        entries = entries.order_by('created_at')

        data = [{
            'date': e.created_at.date().isoformat(),
            'item': e.raw_material.item_name,
            'type': e.get_transaction_type_display(),
            'quantity': float(e.quantity),
            'rate': float(e.rate),
            'value': float(e.value),
            'balance_qty': float(e.balance_qty),
            'reference': e.reference_no,
            'notes': e.notes
        } for e in entries[:500]]
        return Response(data)
