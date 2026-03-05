from django.urls import path
from .views import (
    PurchaseDetailView, PurchaseListView, StockView, StockLedgerView,
    AdjustmentListView, FinishedGoodsView, ScrapStockView, ReorderAlertView,
    BulkOpeningStockImportView, OpeningStockSampleView,ProductionOrderDetailView
)

urlpatterns = [
    path('purchases/', PurchaseListView.as_view(), name='purchases'),
    path('stock/', StockView.as_view(), name='stock'),
    path('ledger/<int:item_id>/', StockLedgerView.as_view(), name='stock_ledger'),
    path('adjustments/', AdjustmentListView.as_view(), name='adjustments'),
    path('finished-goods/', FinishedGoodsView.as_view(), name='finished_goods'),
    path('scrap/', ScrapStockView.as_view(), name='scrap'),
    path('reorder-alerts/', ReorderAlertView.as_view(), name='reorder_alerts'),
    path('opening-stock-import/', BulkOpeningStockImportView.as_view(), name='opening_stock_import'),
    path('opening-stock-sample/', OpeningStockSampleView.as_view(), name='opening_stock_sample'),
    path('purchases/<int:pk>/', PurchaseDetailView.as_view()),
    path('production-orders/<int:pk>/', ProductionOrderDetailView.as_view()),
]
