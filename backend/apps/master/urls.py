from django.urls import path
from .views import RawMaterialListView, RawMaterialDetailView, ProductModelListView, ProductModelDetailView

urlpatterns = [
    path('raw-materials/', RawMaterialListView.as_view(), name='raw_materials'),
    path('raw-materials/<int:pk>/', RawMaterialDetailView.as_view(), name='raw_material_detail'),
    path('products/', ProductModelListView.as_view(), name='products'),
    path('products/<int:pk>/', ProductModelDetailView.as_view(), name='product_detail'),
]
