from datetime import date, timedelta
from decimal import Decimal
from django.db.models import Sum, Count, F
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from apps.master.models import RawMaterial, ProductModel
from apps.inventory.models import PurchaseEntry, FinishedGoodsStock, ScrapStock, StockLedger
from apps.production.models import ProductionOrder, ProductionMaterialUsage


class DashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        today = date.today()
        month_start = today.replace(day=1)
        year = today.year
        month = today.month

        # KPI: Raw material stock value
        rm_items = RawMaterial.objects.filter(status=True)
        rm_stock_value = sum(float(i.current_stock) * float(i.moving_avg_cost or i.default_cost) for i in rm_items)
        rm_count = rm_items.count()

        # KPI: Finished goods
        fg_total = FinishedGoodsStock.objects.aggregate(total=Sum('quantity'))['total'] or 0

        # KPI: Today's production
        today_orders = ProductionOrder.objects.filter(date=today, status='COMPLETED')
        today_produced = today_orders.aggregate(total=Sum('qty_produced'))['total'] or 0
        today_rejected = today_orders.aggregate(total=Sum('qty_rejected'))['total'] or 0

        # KPI: Reorder alerts
        reorder_items = [i for i in rm_items if i.current_stock <= i.reorder_level and i.reorder_level > 0]

        # Monthly production (last 6 months)
        monthly_data = []
        for i in range(5, -1, -1):
            d = today.replace(day=1) - timedelta(days=1)
            for _ in range(i):
                d = d.replace(day=1) - timedelta(days=1)
            m_start = d.replace(day=1)
            m_end = (m_start.replace(month=m_start.month % 12 + 1, day=1) - timedelta(days=1)) if m_start.month < 12 else m_start.replace(month=12, day=31)
            m_orders = ProductionOrder.objects.filter(date__gte=m_start, date__lte=m_end, status='COMPLETED')
            m_produced = m_orders.aggregate(total=Sum('qty_produced'))['total'] or 0
            m_rejected = m_orders.aggregate(total=Sum('qty_rejected'))['total'] or 0
            monthly_data.append({
                'month': m_start.strftime('%b %Y'),
                'produced': float(m_produced),
                'rejected': float(m_rejected),
                'net': float(m_produced) - float(m_rejected)
            })

        # Monthly model-wise (current month)
        model_wise = []
        for model in ProductModel.objects.filter(status=True):
            orders = ProductionOrder.objects.filter(
                product_model=model, date__gte=month_start, date__lte=today, status='COMPLETED'
            )
            produced = orders.aggregate(total=Sum('qty_produced'))['total'] or 0
            rejected = orders.aggregate(total=Sum('qty_rejected'))['total'] or 0
            if produced > 0:
                model_wise.append({
                    'model_id': model.model_id,
                    'model_name': model.model_name,
                    'produced': float(produced),
                    'rejected': float(rejected),
                    'net': float(produced) - float(rejected)
                })

        # Top consumed materials (current month)
        top_materials = ProductionMaterialUsage.objects.filter(
            production_order__date__gte=month_start
        ).values('raw_material__item_name', 'raw_material__unit').annotate(
            total_qty=Sum('qty_used'), total_cost=Sum('cost')
        ).order_by('-total_cost')[:10]

        # Scrap summary (current month)
        scrap_data = ScrapStock.objects.filter(
            created_at__date__gte=month_start
        ).values('product_model__model_name').annotate(
            total_qty=Sum('quantity')
        ).order_by('-total_qty')

        return Response({
            'kpis': {
                'rm_stock_value': round(rm_stock_value, 2),
                'rm_item_count': rm_count,
                'fg_total': float(fg_total),
                'reorder_alerts': len(reorder_items),
                'today_produced': float(today_produced),
                'today_rejected': float(today_rejected),
            },
            'monthly_production_trend': monthly_data,
            'current_month_model_wise': model_wise,
            'top_consumed_materials': list(top_materials),
            'scrap_summary': list(scrap_data),
            'reorder_items': [
                {
                    'id': i.id,
                    'item_id': i.item_id,
                    'item_name': i.item_name,
                    'current_stock': float(i.current_stock),
                    'reorder_level': float(i.reorder_level),
                    'unit': i.unit
                } for i in reorder_items[:10]
            ]
        })
