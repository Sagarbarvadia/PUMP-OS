from rest_framework import serializers
from .models import ProductionOrder, ProductionMaterialUsage


class MaterialUsageSerializer(serializers.ModelSerializer):
    item_name = serializers.CharField(source='raw_material.item_name', read_only=True)
    item_id = serializers.CharField(source='raw_material.item_id', read_only=True)
    unit = serializers.CharField(source='raw_material.unit', read_only=True)

    class Meta:
        model = ProductionMaterialUsage
        fields = ['id', 'raw_material', 'item_id', 'item_name', 'unit', 'qty_used', 'rate', 'cost']


class ProductionOrderSerializer(serializers.ModelSerializer):
    material_usage = MaterialUsageSerializer(many=True, read_only=True)
    model_name = serializers.CharField(source='product_model.model_name', read_only=True)
    model_id_str = serializers.CharField(source='product_model.model_id', read_only=True)
    created_by_name = serializers.CharField(source='created_by.username', read_only=True, default='')
    net_produced = serializers.SerializerMethodField()

    class Meta:
        model = ProductionOrder
        fields = [
            'id', 'order_no', 'date', 'product_model', 'model_name', 'model_id_str',
            'qty_planned', 'qty_produced', 'qty_rejected', 'net_produced',
            'batch_no', 'status', 'batch_cost', 'cost_per_unit',
            'notes', 'created_by_name', 'material_usage', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'batch_cost', 'cost_per_unit', 'created_at', 'updated_at']

    def get_net_produced(self, obj):
        return float(obj.qty_produced - obj.qty_rejected)


class ProductionOrderListSerializer(serializers.ModelSerializer):
    model_name = serializers.CharField(source='product_model.model_name', read_only=True)
    net_produced = serializers.SerializerMethodField()

    class Meta:
        model = ProductionOrder
        fields = [
            'id', 'order_no', 'date', 'product_model', 'model_name',
            'qty_planned', 'qty_produced', 'qty_rejected', 'net_produced',
            'batch_no', 'status', 'batch_cost', 'cost_per_unit', 'created_at'
        ]

    def get_net_produced(self, obj):
        return float(obj.qty_produced - obj.qty_rejected)
