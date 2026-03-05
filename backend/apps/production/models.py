from django.conf import settings
from django.db import models


class ProductionOrder(models.Model):
    STATUS_CHOICES = [
        ('PLANNED', 'Planned'),
        ('IN_PROGRESS', 'In Progress'),
        ('COMPLETED', 'Completed'),
        ('CANCELLED', 'Cancelled'),
    ]

    order_no = models.CharField(max_length=50, unique=True)
    date = models.DateField()
    product_model = models.ForeignKey(
        'master.ProductModel', on_delete=models.PROTECT, related_name='production_orders'
    )
    qty_planned = models.DecimalField(max_digits=15, decimal_places=4)
    qty_produced = models.DecimalField(max_digits=15, decimal_places=4, default=0)
    qty_rejected = models.DecimalField(max_digits=15, decimal_places=4, default=0)
    batch_no = models.CharField(max_length=100)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PLANNED')
    batch_cost = models.DecimalField(max_digits=20, decimal_places=4, default=0)
    cost_per_unit = models.DecimalField(max_digits=15, decimal_places=4, default=0)
    notes = models.TextField(blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'production_orders'
        ordering = ['-date', '-created_at']

    def __str__(self):
        return f"{self.order_no} - {self.product_model.model_name}"


class ProductionMaterialUsage(models.Model):
    production_order = models.ForeignKey(
        ProductionOrder, on_delete=models.CASCADE, related_name='material_usage'
    )
    raw_material = models.ForeignKey(
        'master.RawMaterial', on_delete=models.PROTECT, related_name='production_usage'
    )
    qty_used = models.DecimalField(max_digits=15, decimal_places=4)
    rate = models.DecimalField(max_digits=15, decimal_places=4)
    cost = models.DecimalField(max_digits=20, decimal_places=4)

    class Meta:
        db_table = 'production_material_usage'

    def __str__(self):
        return f"{self.production_order.order_no} - {self.raw_material.item_name}"
