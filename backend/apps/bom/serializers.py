from rest_framework import serializers
from .models import BOM, BOMItem
from apps.master.serializers import RawMaterialListSerializer


class BOMItemSerializer(serializers.ModelSerializer):
    raw_material_detail = RawMaterialListSerializer(source='raw_material', read_only=True)
    effective_qty_per_unit = serializers.ReadOnlyField()
    line_cost = serializers.ReadOnlyField()
    line_cost_with_gst = serializers.ReadOnlyField()
    line_gst_amount = serializers.ReadOnlyField()

    class Meta:
        model = BOMItem
        fields = [
            'id', 'raw_material', 'raw_material_detail', 'qty_per_unit',
            'scrap_percent', 'process_stage', 'effective_qty_per_unit', 'line_cost', 'line_cost_with_gst', 'line_gst_amount'
        ]


class BOMSerializer(serializers.ModelSerializer):
    items = BOMItemSerializer(many=True, read_only=True)
    total_cost = serializers.ReadOnlyField()
    total_cost_with_gst = serializers.ReadOnlyField()
    total_gst_amount = serializers.ReadOnlyField()
    item_count = serializers.ReadOnlyField()
    product_model_name = serializers.CharField(source='product_model.model_name', read_only=True)
    product_model_id_str = serializers.CharField(source='product_model.model_id', read_only=True)

    class Meta:
        model = BOM
        fields = [
            'id', 'product_model', 'product_model_name', 'product_model_id_str',
            'notes', 'gst_percent', 'is_active', 'total_cost', 'total_cost_with_gst', 'total_gst_amount', 
            'item_count', 'items', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class BOMListSerializer(serializers.ModelSerializer):
    total_cost = serializers.ReadOnlyField()
    total_cost_with_gst = serializers.ReadOnlyField()
    total_gst_amount = serializers.ReadOnlyField()
    item_count = serializers.ReadOnlyField()
    product_model_name = serializers.CharField(source='product_model.model_name', read_only=True)

    class Meta:
        model = BOM
        fields = [
            'id', 'product_model', 'product_model_name',
            'notes', 'gst_percent', 'is_active', 'total_cost', 'total_cost_with_gst', 'total_gst_amount', 
            'item_count', 'updated_at'
        ]
