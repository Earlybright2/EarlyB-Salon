import json

from rest_framework import serializers

from apps.shop.models import (
    Appointment,
    Hairstyle,
    Hero,
    Product,
    Review,
    Salon,
    Service,
    Stylist,
)


def _parse_list(value):
    if not value:
        return []
    if isinstance(value, list):
        return value
    try:
        parsed = json.loads(value)
        return parsed if isinstance(parsed, list) else [str(parsed)]
    except (ValueError, TypeError):
        return [item.strip() for item in str(value).split(",") if item.strip()]


class ProductSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(read_only=True)
    comparePrice = serializers.DecimalField(source="compare_price", max_digits=10, decimal_places=2, read_only=True)
    stockQuantity = serializers.IntegerField(source="stock_quantity", read_only=True)
    isNew = serializers.BooleanField(source="is_new", read_only=True)
    isFeatured = serializers.BooleanField(source="is_featured", read_only=True)
    isActive = serializers.BooleanField(source="is_active", read_only=True)
    averageRating = serializers.DecimalField(source="average_rating", max_digits=3, decimal_places=2, read_only=True)
    totalReviews = serializers.IntegerField(source="total_reviews", read_only=True)
    imageUrl = serializers.SerializerMethodField()
    images = serializers.SerializerMethodField()
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)
    usageGuide = serializers.CharField(source="usage_guide", read_only=True)

    class Meta:
        model = Product
        fields = [
            "id",
            "name",
            "description",
            "category",
            "price",
            "comparePrice",
            "stockQuantity",
            "sku",
            "ingredients",
            "usageGuide",
            "badge",
            "isNew",
            "isFeatured",
            "isActive",
            "averageRating",
            "totalReviews",
            "imageUrl",
            "images",
            "createdAt",
        ]

    def get_imageUrl(self, obj):
        if obj.image:
            request = self.context.get("request")
            if request is not None:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        first = obj.images.order_by("display_order").first() if hasattr(obj, "images") else None
        return first.image_url if first else None

    def get_images(self, obj):
        if not hasattr(obj, "images"):
            return []
        return [
            {"url": img.image_url, "alt": img.alt_text, "order": img.display_order}
            for img in obj.images.all()
        ]
