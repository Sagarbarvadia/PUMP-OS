from rest_framework import serializers
from .models import RawMaterial, ProductModel


class RawMaterialSerializer(serializers.ModelSerializer):
    effective_cost = serializers.ReadOnlyField()
    stock_value = serializers.ReadOnlyField()
    is_below_reorder = serializers.ReadOnlyField()
    is_used = serializers.SerializerMethodField()

    class Meta:
        model = RawMaterial
        fields = [
            'id', 'item_id', 'item_name', 'category', 'unit','current_stock',
            'reorder_level', 'default_cost', 'lead_time', 'status', 'moving_avg_cost', 'effective_cost',
            'stock_value', 'is_below_reorder', 'is_used', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_is_used(self, obj):
        return obj.bom_items.exists()


class RawMaterialListSerializer(serializers.ModelSerializer):
    effective_cost = serializers.ReadOnlyField()
    is_below_reorder = serializers.ReadOnlyField()
    is_used = serializers.SerializerMethodField()

    class Meta:
        model = RawMaterial
        fields = [
            'id',
            'item_id',
            'item_name',
            'category',
            'unit',
            'current_stock',
            'moving_avg_cost',
            'effective_cost',
            'reorder_level',
            'default_cost',
            'lead_time',
            'is_below_reorder',
            'is_used',
            'status'
        ]

    def get_is_used(self, obj):
        return obj.bom_items.exists()


class ProductModelSerializer(serializers.ModelSerializer):
    manufacturing_cost = serializers.ReadOnlyField()
    has_bom = serializers.SerializerMethodField()

    class Meta:
        model = ProductModel
        fields = [
            'id', 'model_id', 'model_name', 'brand', 'description',
            'status', 'manufacturing_cost', 'has_bom', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_has_bom(self, obj):
        return obj.boms.filter(is_active=True).exists()
