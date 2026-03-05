from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

from .models import RawMaterial, ProductModel
from .serializers import RawMaterialSerializer, RawMaterialListSerializer, ProductModelSerializer
from apps.authentication.permissions import IsAdmin, IsAdminOrStoreManager


class RawMaterialListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        items = RawMaterial.objects.all()
        category = request.query_params.get('category')
        status_filter = request.query_params.get('status')
        search = request.query_params.get('search', '')
        if category:
            items = items.filter(category=category)
        if status_filter is not None:
            items = items.filter(status=(status_filter == 'true'))
        if search:
            items = items.filter(item_name__icontains=search) | items.filter(item_id__icontains=search)
        return Response(RawMaterialListSerializer(items, many=True).data)

    def post(self, request):
        if request.user.role not in ['ADMIN', 'STORE_MANAGER']:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        serializer = RawMaterialSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class RawMaterialDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, pk):
        try:
            return RawMaterial.objects.get(pk=pk)
        except RawMaterial.DoesNotExist:
            return None

    def get(self, request, pk):
        obj = self.get_object(pk)
        if not obj:
            return Response({'error': 'Not found'}, status=404)
        return Response(RawMaterialSerializer(obj).data)

    def put(self, request, pk):
        if request.user.role not in ['ADMIN', 'STORE_MANAGER']:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        obj = self.get_object(pk)
        if not obj:
            return Response({'error': 'Not found'}, status=404)
        serializer = RawMaterialSerializer(obj, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        if request.user.role not in ['ADMIN', 'STORE_MANAGER']:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        obj = self.get_object(pk)
        if not obj:
            return Response({'error': 'Not found'}, status=404)
        # Check if used in BOM
        if obj.bom_items.exists():
            return Response({'error': 'Cannot delete — item is used in BOM'}, status=400)
        obj.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ProductModelListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        items = ProductModel.objects.all()
        status_filter = request.query_params.get('status')
        if status_filter is not None:
            items = items.filter(status=(status_filter == 'true'))
        return Response(ProductModelSerializer(items, many=True).data)

    def post(self, request):
        if request.user.role not in ['ADMIN', 'PRODUCTION_MANAGER', 'STORE_MANAGER']:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        serializer = ProductModelSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ProductModelDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, pk):
        try:
            return ProductModel.objects.get(pk=pk)
        except ProductModel.DoesNotExist:
            return None

    def get(self, request, pk):
        obj = self.get_object(pk)
        if not obj:
            return Response({'error': 'Not found'}, status=404)
        return Response(ProductModelSerializer(obj).data)

    def put(self, request, pk):
        if request.user.role not in ['ADMIN', 'PRODUCTION_MANAGER', 'STORE_MANAGER']:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        obj = self.get_object(pk)
        if not obj:
            return Response({'error': 'Not found'}, status=404)
        serializer = ProductModelSerializer(obj, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        if request.user.role != 'ADMIN':
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        obj = self.get_object(pk)
        if not obj:
            return Response({'error': 'Not found'}, status=404)
        if obj.production_orders.exists():
            return Response({'error': 'Cannot delete — model has production history'}, status=400)
        obj.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
