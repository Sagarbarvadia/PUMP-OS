from django.urls import path
from .views import (
    RawMaterialStockReportView, FinishedGoodsReportView,
    MonthlyProductionReportView, DailyProductionReportView,
    BOMCostReportView, WastageReportView, ReorderReportView, StockMovementReportView
)

urlpatterns = [
    path('rm-stock/', RawMaterialStockReportView.as_view(), name='report_rm_stock'),
    path('finished-goods/', FinishedGoodsReportView.as_view(), name='report_fg'),
    path('monthly-production/', MonthlyProductionReportView.as_view(), name='report_monthly'),
    path('daily-production/', DailyProductionReportView.as_view(), name='report_daily'),
    path('bom-cost/', BOMCostReportView.as_view(), name='report_bom_cost'),
    path('wastage/', WastageReportView.as_view(), name='report_wastage'),
    path('reorder/', ReorderReportView.as_view(), name='report_reorder'),
    path('stock-movement/', StockMovementReportView.as_view(), name='report_stock_movement'),
]
