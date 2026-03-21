from rest_framework import serializers
from .models import PurchaseEntry, StockLedger, InventoryAdjustment, FinishedGoodsStock, ScrapStock
from apps.master.serializers import RawMaterialListSerializer


class PurchaseEntrySerializer(serializers.ModelSerializer):
    item_name = serializers.CharField(source='raw_material.item_name', read_only=True)
    item_unit = serializers.CharField(source='raw_material.unit', read_only=True)
    created_by_name = serializers.CharField(source='created_by.username', read_only=True, default='')

    class Meta:
        model = PurchaseEntry
        fields = [
            'id', 'purchase_date', 'supplier_name', 'raw_material',
            'item_name', 'item_unit', 'quantity', 'purchase_rate',
            'gst_percent', 'total_amount', 'notes', 'created_by_name', 'created_at'
        ]
        read_only_fields = ['id', 'created_at', 'total_amount']


class StockLedgerSerializer(serializers.ModelSerializer):
    class Meta:
        model = StockLedger
        fields = '__all__'


class InventoryAdjustmentSerializer(serializers.ModelSerializer):
    item_name = serializers.CharField(source='raw_material.item_name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.username', read_only=True, default='')

    class Meta:
        model = InventoryAdjustment
        fields = [
            'id', 'raw_material', 'item_name', 'adjustment_type',
            'quantity', 'reason', 'created_by_name', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class FinishedGoodsStockSerializer(serializers.ModelSerializer):
    model_name = serializers.CharField(source='product_model.model_name', read_only=True)
    model_id_str = serializers.CharField(source='product_model.model_id', read_only=True)

    class Meta:
        model = FinishedGoodsStock
        fields = ['id', 'product_model', 'model_name', 'model_id_str', 'quantity', 'batch_no', 'created_at']


class ScrapStockSerializer(serializers.ModelSerializer):
    model_name = serializers.CharField(source='product_model.model_name', read_only=True)

    class Meta:
        model = ScrapStock
        fields = ['id', 'product_model', 'model_name', 'quantity', 'batch_no', 'notes', 'created_at']
