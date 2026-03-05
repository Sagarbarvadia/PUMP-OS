from django.contrib import admin
from django.urls import path, include
from django.views.generic import TemplateView
from django.urls import re_path

re_path(r'^(?!api/).*$', TemplateView.as_view(template_name='index.html')),

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('apps.authentication.urls')),
    path('api/master/', include('apps.master.urls')),
    path('api/bom/', include('apps.bom.urls')),
    path('api/inventory/', include('apps.inventory.urls')),
    path('api/production/', include('apps.production.urls')),
    path('api/dashboard/', include('apps.dashboard.urls')),
    path('api/reports/', include('apps.reports.urls')),
]
