from django.conf import settings
from django.db import models


class PurchaseEntry(models.Model):
    purchase_date = models.DateField()
    supplier_name = models.CharField(max_length=200)
    raw_material = models.ForeignKey(
        'master.RawMaterial', on_delete=models.PROTECT, related_name='purchases'
    )
    quantity = models.DecimalField(max_digits=15, decimal_places=4)
    purchase_rate = models.DecimalField(max_digits=15, decimal_places=4)
    total_amount = models.DecimalField(max_digits=20, decimal_places=4)
    notes = models.TextField(blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'purchase_entries'
        ordering = ['-purchase_date', '-created_at']

    def __str__(self):
        return f"Purchase {self.id} - {self.raw_material.item_name} x {self.quantity}"


class StockLedger(models.Model):
    TRANSACTION_TYPES = [
        ('OPENING', 'Opening Balance'),
        ('PURCHASE', 'Purchase'),
        ('PRODUCTION', 'Production'),
        ('ADJUSTMENT_ADD', 'Manual Add'),
        ('ADJUSTMENT_SUB', 'Manual Subtract'),
    ]

    raw_material = models.ForeignKey(
        'master.RawMaterial', on_delete=models.CASCADE, related_name='ledger_entries'
    )
    transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPES)
    quantity = models.DecimalField(max_digits=15, decimal_places=4)
    rate = models.DecimalField(max_digits=15, decimal_places=4, default=0)
    value = models.DecimalField(max_digits=20, decimal_places=4, default=0)
    balance_qty = models.DecimalField(max_digits=15, decimal_places=4)
    balance_value = models.DecimalField(max_digits=20, decimal_places=4)
    reference_no = models.CharField(max_length=100, blank=True)
    notes = models.TextField(blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'stock_ledger'
        ordering = ['-created_at']


class InventoryAdjustment(models.Model):
    ADJUSTMENT_TYPES = [
        ('ADD', 'Add Stock'),
        ('SUBTRACT', 'Subtract Stock'),
    ]

    raw_material = models.ForeignKey(
        'master.RawMaterial', on_delete=models.PROTECT, related_name='adjustments'
    )
    adjustment_type = models.CharField(max_length=20, choices=ADJUSTMENT_TYPES)
    quantity = models.DecimalField(max_digits=15, decimal_places=4)
    reason = models.TextField()
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'inventory_adjustments'
        ordering = ['-created_at']


class FinishedGoodsStock(models.Model):
    product_model = models.ForeignKey(
        'master.ProductModel', on_delete=models.PROTECT, related_name='fg_stock'
    )
    quantity = models.DecimalField(max_digits=15, decimal_places=4)
    batch_no = models.CharField(max_length=100)
    production_order = models.ForeignKey(
        'production.ProductionOrder', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='fg_entries'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'finished_goods_stock'
        ordering = ['-created_at']


class ScrapStock(models.Model):
    product_model = models.ForeignKey(
        'master.ProductModel', on_delete=models.PROTECT, related_name='scrap_entries'
    )
    quantity = models.DecimalField(max_digits=15, decimal_places=4)
    batch_no = models.CharField(max_length=100)
    production_order = models.ForeignKey(
        'production.ProductionOrder', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='scrap_entries'
    )
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'scrap_stock'
        ordering = ['-created_at']
