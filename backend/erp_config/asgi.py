import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'erp_config.settings')

from django.core.asgi import get_asgi_application
application = get_asgi_application()
