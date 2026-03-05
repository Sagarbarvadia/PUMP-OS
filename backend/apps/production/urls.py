from django.urls import path
from .views import ProductionOrderListView, ProductionOrderDetailView, TodayProductionView

urlpatterns = [
    path('orders/', ProductionOrderListView.as_view(), name='production_orders'),
    path('orders/<int:pk>/', ProductionOrderDetailView.as_view(), name='production_order_detail'),
    path('today/', TodayProductionView.as_view(), name='today_production'),
]
