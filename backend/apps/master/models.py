from django.db import models


class RawMaterial(models.Model):
    CATEGORY_CHOICES = [
        ('ELECTRICAL', 'Electrical'),
        ('MECHANICAL', 'Mechanical'),
        ('HARDWARE', 'Hardware'),
        ('PACKAGING', 'Packaging'),
        ('CONSUMABLE', 'Consumable'),
        ('OTHER', 'Other'),
    ]
    UNIT_CHOICES = [
        ('PCS', 'Pieces'),
        ('KG', 'Kilograms'),
        ('MTR', 'Meters'),
        ('LTR', 'Litres'),
        ('SET', 'Set'),
        ('ROLL', 'Roll'),
        ('BOX', 'Box'),
        ('GM', 'Grams'),
        ('MM', 'Millimeters'),
    ]

    item_id = models.CharField(max_length=200, unique=True)
    item_name = models.CharField(max_length=500)
    category = models.CharField(max_length=200, choices=CATEGORY_CHOICES, default='OTHER')
    unit = models.CharField(max_length=50, choices=UNIT_CHOICES, default='PCS')
    reorder_level = models.DecimalField(max_digits=25, decimal_places=4, default=0)
    default_cost = models.DecimalField(max_digits=25, decimal_places=4, default=0)
    lead_time = models.IntegerField(default=0, help_text='Lead time in days')
    status = models.BooleanField(default=True)
    current_stock = models.DecimalField(max_digits=25, decimal_places=4, default=0)
    moving_avg_cost = models.DecimalField(max_digits=25, decimal_places=4, default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    

    class Meta:
        db_table = 'raw_materials'
        ordering = ['item_name']

    def __str__(self):
        return f"{self.item_id} - {self.item_name}"

    @property
    def effective_cost(self):
        return self.moving_avg_cost if self.moving_avg_cost > 0 else self.default_cost

    @property
    def is_below_reorder(self):
        return self.current_stock <= self.reorder_level and self.reorder_level > 0

    @property
    def stock_value(self):
        return float(self.current_stock) * float(self.effective_cost)


class ProductModel(models.Model):
    model_id = models.CharField(max_length=50, unique=True)
    model_name = models.CharField(max_length=200)
    brand = models.CharField(max_length=100, blank=True)
    description = models.TextField(blank=True)
    status = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'product_models'
        ordering = ['model_name']

    def __str__(self):
        return f"{self.model_id} - {self.model_name}"

    @property
    def manufacturing_cost(self):
        try:
            bom = self.boms.filter(is_active=True).prefetch_related('items__raw_material').first()
            if bom:
                return bom.total_cost
        except Exception:
            pass
        return 0

    @property
    def active_bom(self):
        return self.boms.filter(is_active=True).first()
