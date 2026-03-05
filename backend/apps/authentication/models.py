from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    ROLE_CHOICES = [
        ('ADMIN', 'Admin'),
        ('PRODUCTION_MANAGER', 'Production Manager'),
        ('STORE_MANAGER', 'Store Manager'),
        ('ACCOUNTANT', 'Accountant'),
    ]
    email = models.EmailField(unique=True)
    role = models.CharField(max_length=25, choices=ROLE_CHOICES, default='STORE_MANAGER')

    class Meta:
        db_table = 'auth_users'

    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"
