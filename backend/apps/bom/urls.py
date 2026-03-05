from django.urls import path
from .views import BOMListView, BOMDetailView, BOMImportView, BOMExportView, BOMSampleDownloadView

urlpatterns = [
    path('', BOMListView.as_view(), name='bom_list'),
    path('<int:pk>/', BOMDetailView.as_view(), name='bom_detail'),
    path('import/', BOMImportView.as_view(), name='bom_import'),
    path('<int:pk>/export/', BOMExportView.as_view(), name='bom_export'),
    path('sample/', BOMSampleDownloadView.as_view(), name='bom_sample'),
]
