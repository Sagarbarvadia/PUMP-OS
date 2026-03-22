from django.conf import settings
from django.db import models
from decimal import Decimal


class BOM(models.Model):
    GST_CHOICES = [
        (0, '0%'),
        (5, '5%'),
        (12, '12%'),
        (18, '18%'),
    ]
    
    product_model = models.ForeignKey(
        'master.ProductModel', on_delete=models.PROTECT, related_name='boms'
    )
    notes = models.TextField(blank=True)
    gst_percent = models.IntegerField(choices=GST_CHOICES, default=18)
    is_active = models.BooleanField(default=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'boms'
        ordering = ['-created_at']

    def __str__(self):
        return f"BOM - {self.product_model.model_name}"

    @property
    def total_cost(self):
        total = Decimal('0')
        for item in self.items.select_related('raw_material').all():
            rate = item.raw_material.moving_avg_cost
            if rate == 0:
                rate = item.raw_material.default_cost
            effective_qty = item.qty_per_unit * (1 + item.scrap_percent / 100)
            total += effective_qty * rate
        return round(total, 4)

    @property
    def total_cost_with_gst(self):
        base_cost = self.total_cost
        gst_amount = base_cost * (Decimal(self.gst_percent) / 100)
        return round(base_cost + gst_amount, 4)

    @property
    def total_gst_amount(self):
        base_cost = self.total_cost
        return round(base_cost * (Decimal(self.gst_percent) / 100), 4)

    @property
    def item_count(self):
        return self.items.count()


class BOMItem(models.Model):
    bom = models.ForeignKey(BOM, on_delete=models.CASCADE, related_name='items')
    raw_material = models.ForeignKey(
        'master.RawMaterial', on_delete=models.PROTECT, related_name='bom_items'
    )
    qty_per_unit = models.DecimalField(max_digits=15, decimal_places=4)
    scrap_percent = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    process_stage = models.CharField(max_length=100, blank=True)

    class Meta:
        db_table = 'bom_items'
        unique_together = [('bom', 'raw_material')]

    def __str__(self):
        return f"{self.raw_material.item_name} x {self.qty_per_unit}"

    @property
    def effective_qty_per_unit(self):
        return self.qty_per_unit * (1 + self.scrap_percent / 100)

    @property
    def line_cost(self):
        rate = self.raw_material.moving_avg_cost
        if rate == 0:
            rate = self.raw_material.default_cost
        return round(self.effective_qty_per_unit * rate, 4)

    @property
    def line_cost_with_gst(self):
        base_cost = self.line_cost
        gst_amount = base_cost * (Decimal(self.bom.gst_percent) / 100)
        return round(base_cost + gst_amount, 4)

    @property
    def line_gst_amount(self):
        base_cost = self.line_cost
        return round(base_cost * (Decimal(self.bom.gst_percent) / 100), 4)
