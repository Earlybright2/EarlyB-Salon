from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.shop.models import Hairstyle, Product, Salon, Service
from apps.shop.serializers import (
    HairstyleSerializer,
    ProductSerializer,
    SalonSerializer,
    ServiceSerializer,
)


class ProductsListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        products = Product.objects.all()
        return Response(ProductSerializer(products, many=True).data)


class ProductDetailView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, pk):
        try:
            product = Product.objects.get(pk=pk)
        except Product.DoesNotExist:
            return Response(None)
        return Response(ProductSerializer(product).data)


class ProductsByCategoryView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, category):
        products = Product.objects.filter(category=category)
        return Response(ProductSerializer(products, many=True).data)


class FeaturedProductsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        products = Product.objects.filter(is_featured=True)
        return Response(ProductSerializer(products, many=True).data)


class SalonsListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        salons = Salon.objects.all()
        return Response(SalonSerializer(salons, many=True).data)


class SalonDetailView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, pk):
        try:
            salon = Salon.objects.get(pk=pk)
        except Salon.DoesNotExist:
            return Response(None)
        return Response(SalonSerializer(salon).data)


class FeaturedSalonsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        salons = Salon.objects.filter(is_featured=True)
        return Response(SalonSerializer(salons, many=True).data)


class SalonServicesView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, pk):
        services = Service.objects.filter(salon_id=pk)
        return Response(ServiceSerializer(services, many=True).data)


class HairstylesListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        hairstyles = Hairstyle.objects.all()
        return Response(HairstyleSerializer(hairstyles, many=True).data)


class HairstyleDetailView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, pk):
        try:
            hairstyle = Hairstyle.objects.get(pk=pk)
        except Hairstyle.DoesNotExist:
            return Response(None)
        return Response(HairstyleSerializer(hairstyle).data)
