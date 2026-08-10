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
            "id", "name", "description", "category", "price", "comparePrice",
            "stockQuantity", "sku", "ingredients", "usageGuide", "badge",
            "isNew", "isFeatured", "isActive", "averageRating", "totalReviews",
            "imageUrl", "images", "createdAt",
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


class SalonSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(read_only=True)
    ownerId = serializers.IntegerField(source="owner_id", read_only=True)
    businessName = serializers.CharField(source="business_name", read_only=True)
    phoneNumber = serializers.CharField(source="phone_number", read_only=True)
    websiteUrl = serializers.CharField(source="website_url", read_only=True)
    instagramUrl = serializers.CharField(source="instagram_url", read_only=True)
    coverPhoto = serializers.CharField(source="cover_photo", read_only=True)
    logoUrl = serializers.CharField(source="logo_url", read_only=True)
    workingHours = serializers.JSONField(source="working_hours", read_only=True)
    isVerified = serializers.BooleanField(source="is_verified", read_only=True)
    isActive = serializers.BooleanField(source="is_active", read_only=True)
    isFeatured = serializers.BooleanField(source="is_featured", read_only=True)
    averageRating = serializers.DecimalField(source="average_rating", max_digits=3, decimal_places=2, read_only=True)
    totalReviews = serializers.IntegerField(source="total_reviews", read_only=True)
    seatCapacity = serializers.IntegerField(source="seat_capacity", read_only=True)
    currentOccupancy = serializers.IntegerField(source="current_occupancy", read_only=True)
    busyPercentage = serializers.IntegerField(source="busy_percentage", read_only=True)
    imageUrl = serializers.SerializerMethodField()
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)
    updatedAt = serializers.DateTimeField(source="updated_at", read_only=True)

    class Meta:
        model = Salon
        fields = [
            "id", "ownerId", "businessName", "description", "address", "city", "state",
            "country", "latitude", "longitude", "phoneNumber", "email", "websiteUrl",
            "instagramUrl", "coverPhoto", "logoUrl", "imageUrl", "workingHours",
            "isVerified", "isActive", "isFeatured", "averageRating", "totalReviews",
            "seatCapacity", "currentOccupancy", "busyPercentage", "createdAt", "updatedAt",
        ]

    def get_imageUrl(self, obj):
        if obj.image:
            request = self.context.get("request")
            if request is not None:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return obj.cover_photo or obj.logo_url


class ServiceSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(read_only=True)
    salonId = serializers.IntegerField(source="salon_id", read_only=True)
    stylistId = serializers.IntegerField(source="stylist_id", read_only=True)
    minPrice = serializers.DecimalField(source="min_price", max_digits=10, decimal_places=2, read_only=True)
    maxPrice = serializers.DecimalField(source="max_price", max_digits=10, decimal_places=2, read_only=True)
    durationMin = serializers.IntegerField(source="duration_min", read_only=True)
    isActive = serializers.BooleanField(source="is_active", read_only=True)
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)

    class Meta:
        model = Service
        fields = [
            "id", "salonId", "stylistId", "name", "description", "category",
            "minPrice", "maxPrice", "durationMin", "isActive", "createdAt",
        ]


class HairstyleSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(read_only=True)
    genderTarget = serializers.CharField(source="gender_target", read_only=True)
    faceShapes = serializers.SerializerMethodField()
    hairTypes = serializers.SerializerMethodField()
    thumbnailUrl = serializers.CharField(source="thumbnail_url", read_only=True)
    trendScore = serializers.IntegerField(source="trend_score", read_only=True)
    isCelebrity = serializers.BooleanField(source="is_celebrity", read_only=True)
    celebrityName = serializers.CharField(source="celebrity_name", read_only=True)
    tags = serializers.SerializerMethodField()
    imageUrl = serializers.SerializerMethodField()
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)

    class Meta:
        model = Hairstyle
        fields = [
            "id", "name", "category", "genderTarget", "faceShapes", "hairTypes",
            "thumbnailUrl", "trendScore", "isCelebrity", "celebrityName", "tags",
            "imageUrl", "createdAt",
        ]

    def get_faceShapes(self, obj):
        return _parse_list(obj.face_shapes)

    def get_hairTypes(self, obj):
        return _parse_list(obj.hair_types)

    def get_tags(self, obj):
        return _parse_list(obj.tags)

    def get_imageUrl(self, obj):
        if obj.image:
            request = self.context.get("request")
            if request is not None:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return obj.thumbnail_url


class StylistSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(read_only=True)
    userId = serializers.IntegerField(source="user_id", read_only=True)
    displayName = serializers.CharField(source="display_name", read_only=True)
    kycStatus = serializers.CharField(source="kyc_status", read_only=True)
    kycSubmittedAt = serializers.DateTimeField(source="kyc_submitted_at", read_only=True)
    kycApprovedAt = serializers.DateTimeField(source="kyc_approved_at", read_only=True)
    averageRating = serializers.DecimalField(source="average_rating", max_digits=3, decimal_places=2, read_only=True)
    totalReviews = serializers.IntegerField(source="total_reviews", read_only=True)
    totalEarnings = serializers.DecimalField(source="total_earnings", max_digits=15, decimal_places=2, read_only=True)
    subscriptionPlan = serializers.CharField(source="subscription_plan", read_only=True)
    isFeatured = serializers.BooleanField(source="is_featured", read_only=True)
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)

    class Meta:
        model = Stylist
        fields = [
            "id", "userId", "displayName", "bio", "kycStatus", "kycSubmittedAt",
            "kycApprovedAt", "averageRating", "totalReviews", "totalEarnings",
            "subscriptionPlan", "isFeatured", "createdAt",
        ]


class AppointmentSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(read_only=True)
    bookingReference = serializers.CharField(source="booking_reference", read_only=True)
    totalAmount = serializers.DecimalField(source="total_amount", max_digits=12, decimal_places=2, read_only=True)
    paymentStatus = serializers.CharField(source="payment_status", read_only=True)
    userNotes = serializers.CharField(source="user_notes", read_only=True)
    scheduledAt = serializers.DateTimeField(source="scheduled_at", read_only=True)
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)

    class Meta:
        model = Appointment
        fields = [
            "id", "bookingReference", "totalAmount", "status", "paymentStatus",
            "userNotes", "scheduledAt", "createdAt",
        ]


class ReviewSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(read_only=True)
    targetType = serializers.CharField(source="target_type", read_only=True)
    targetId = serializers.IntegerField(source="target_id", read_only=True)
    isVerified = serializers.BooleanField(source="is_verified", read_only=True)
    isFeatured = serializers.BooleanField(source="is_featured", read_only=True)
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)

    class Meta:
        model = Review
        fields = [
            "id", "rating", "title", "body", "targetType", "targetId",
            "isVerified", "isFeatured", "createdAt",
        ]


class HeroSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(read_only=True)
    imageUrl = serializers.SerializerMethodField()
    isActive = serializers.BooleanField(source="is_active", read_only=True)

    class Meta:
        model = Hero
        fields = ["id", "title", "subtitle", "imageUrl", "isActive", "order"]

    def get_imageUrl(self, obj):
        if obj.image:
            request = self.context.get("request")
            if request is not None:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None
