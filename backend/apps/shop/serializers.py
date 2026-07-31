from rest_framework import serializers

from apps.shop.models import (
    Appointment,
    Hairstyle,
    Product,
    Review,
    Salon,
    Service,
    Stylist,
)


class ProductSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(read_only=True)
    comparePrice = serializers.DecimalField(source="compare_price", max_digits=10, decimal_places=2, read_only=True)
    stockQuantity = serializers.IntegerField(source="stock_quantity", read_only=True)
    isNew = serializers.BooleanField(source="is_new", read_only=True)
    isFeatured = serializers.BooleanField(source="is_featured", read_only=True)
    isActive = serializers.BooleanField(source="is_active", read_only=True)
    averageRating = serializers.DecimalField(source="average_rating", max_digits=3, decimal_places=2, read_only=True)
    totalReviews = serializers.IntegerField(source="total_reviews", read_only=True)
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)

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
            "photos",
            "ingredients",
            "usageGuide",
            "badge",
            "isNew",
            "isFeatured",
            "isActive",
            "averageRating",
            "totalReviews",
            "createdAt",
        ]

    usageGuide = serializers.CharField(source="usage_guide", read_only=True)


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
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)
    updatedAt = serializers.DateTimeField(source="updated_at", read_only=True)

    class Meta:
        model = Salon
        fields = [
            "id",
            "ownerId",
            "businessName",
            "description",
            "address",
            "city",
            "state",
            "country",
            "latitude",
            "longitude",
            "phoneNumber",
            "email",
            "websiteUrl",
            "instagramUrl",
            "coverPhoto",
            "logoUrl",
            "workingHours",
            "isVerified",
            "isActive",
            "isFeatured",
            "averageRating",
            "totalReviews",
            "seatCapacity",
            "currentOccupancy",
            "busyPercentage",
            "createdAt",
            "updatedAt",
        ]


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
            "id",
            "salonId",
            "stylistId",
            "name",
            "description",
            "category",
            "minPrice",
            "maxPrice",
            "durationMin",
            "isActive",
            "createdAt",
        ]


class HairstyleSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(read_only=True)
    genderTarget = serializers.CharField(source="gender_target", read_only=True)
    faceShapes = serializers.CharField(source="face_shapes", read_only=True)
    hairTypes = serializers.CharField(source="hair_types", read_only=True)
    thumbnailUrl = serializers.CharField(source="thumbnail_url", read_only=True)
    trendScore = serializers.IntegerField(source="trend_score", read_only=True)
    isCelebrity = serializers.BooleanField(source="is_celebrity", read_only=True)
    celebrityName = serializers.CharField(source="celebrity_name", read_only=True)
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)

    class Meta:
        model = Hairstyle
        fields = [
            "id",
            "name",
            "category",
            "genderTarget",
            "faceShapes",
            "hairTypes",
            "thumbnailUrl",
            "trendScore",
            "isCelebrity",
            "celebrityName",
            "tags",
            "createdAt",
        ]


class StylistSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(read_only=True)
    userId = serializers.IntegerField(source="user_id", read_only=True)
    displayName = serializers.CharField(source="display_name", read_only=True)
    kycStatus = serializers.CharField(source="kyc_status", read_only=True)
    kycSubmittedAt = serializers.DateTimeField(source="kyc_submitted_at", read_only=True)
    kycApprovedAt = serializers.DateTimeField(source="kyc_approved_at", read_only=True)
    averageRating = serializers.DecimalField(source="average_rating", max_digits=3, decimal_places=2, read_only=True)
    totalEarnings = serializers.DecimalField(source="total_earnings", max_digits=15, decimal_places=2, read_only=True)
    subscriptionPlan = serializers.CharField(source="subscription_plan", read_only=True)
    isFeatured = serializers.BooleanField(source="is_featured", read_only=True)
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)

    class Meta:
        model = Stylist
        fields = [
            "id",
            "userId",
            "displayName",
            "bio",
            "kycStatus",
            "kycSubmittedAt",
            "kycApprovedAt",
            "averageRating",
            "totalReviews",
            "totalEarnings",
            "subscriptionPlan",
            "isFeatured",
            "createdAt",
        ]


class AppointmentSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(read_only=True)
    bookingReference = serializers.CharField(source="booking_reference", read_only=True)
    totalAmount = serializers.DecimalField(source="total_amount", max_digits=12, decimal_places=2, read_only=True)
    paymentStatus = serializers.CharField(source="payment_status", read_only=True)
    userNotes = serializers.CharField(source="user_notes", read_only=True)
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)
    scheduledAt = serializers.DateTimeField(source="scheduled_at", read_only=True)

    class Meta:
        model = Appointment
        fields = [
            "id",
            "bookingReference",
            "totalAmount",
            "status",
            "paymentStatus",
            "userNotes",
            "scheduledAt",
            "createdAt",
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
            "id",
            "rating",
            "title",
            "body",
            "targetType",
            "targetId",
            "isVerified",
            "isFeatured",
            "createdAt",
        ]
