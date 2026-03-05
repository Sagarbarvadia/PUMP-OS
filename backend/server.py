import os
import sys

sys.path.insert(0, '/app/backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'erp_config.settings')

import django
django.setup()

from django.core.management import call_command

try:
    call_command('migrate', verbosity=0, interactive=False)
    print("[ERP] Database migrations applied")
except Exception as e:
    print(f"[ERP] Migration warning: {e}")

# Create default admin user if not exists
try:
    from apps.authentication.models import User
    if not User.objects.filter(username='admin').exists():
        User.objects.create_superuser(
            username='admin',
            email='admin@erp.local',
            password='admin123',
            role='ADMIN',
            first_name='System',
            last_name='Admin'
        )
        print("[ERP] Default admin user created (admin / admin123)")
except Exception as e:
    print(f"[ERP] Admin creation warning: {e}")

from django.core.asgi import get_asgi_application
app = get_asgi_application()
