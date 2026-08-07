from django.conf import settings
from django.db import models

from apps.users.models import User


class Stylist(models.Model):
    class KycStatus(models.TextChoices):
        PENDING = "pending", "Pending"
        UNDER_REVIEW = "under_review", "Under Review"
        APPROVED = "approved", "Approved"
        REJECTED = "rejected", "Rejected"

    class SubscriptionPlan(models.TextChoices):
        FREE = "free", "Free"
        PRO = "pro", "Pro"
        ENTERPRISE = "enterprise", "Enterprise"

    id = models.BigAutoField(primary_key=True)
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="stylists",
    )
    display_name = models.CharField(max_length=255, blank=True, null=True)
    bio = models.TextField(blank=True, null=True)
    years_experience = models.IntegerField(null=True, blank=True)
    specializations = models.TextField(blank=True, null=True)
    service_categories = models.TextField(blank=True, null=True)
    working_hours = models.JSONField(default=dict, blank=True)
    is_mobile = models.BooleanField(default=False)
    kyc_status = models.CharField(
        max_length=20, choices=KycStatus.choices, default=KycStatus.PENDING
    )
    kyc_submitted_at = models.DateTimeField(null=True, blank=True)
    kyc_approved_at = models.DateTimeField(null=True, blank=True)
    average_rating = models.DecimalField(max_digits=3, decimal_places=2, default="0")
    total_reviews = models.IntegerField(default=0)
    total_earnings = models.DecimalField(max_digits=15, decimal_places=2, default="0")
    wallet_balance = models.DecimalField(max_digits=15, decimal_places=2, default="0")
    government_id = models.FileField(upload_to="kyc/documents/government_id/", null=True, blank=True)
    business_certificate = models.FileField(upload_to="kyc/documents/business_certificate/", null=True, blank=True)
    utility_bill = models.FileField(upload_to="kyc/documents/utility_bill/", null=True, blank=True)
    salon_photo = models.FileField(upload_to="kyc/documents/salon_photo/", null=True, blank=True)
    is_featured = models.BooleanField(default=False)
    subscription_plan = models.CharField(
        max_length=20, choices=SubscriptionPlan.choices, default=SubscriptionPlan.FREE
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "stylists"
        ordering = ["-created_at"]

    def __str__(self):
        return self.display_name or f"Stylist {self.id}"


class Salon(models.Model):
    id = models.BigAutoField(primary_key=True)
    owner = models.ForeignKey(
        Stylist,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="owned_salons",
    )
    business_name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    address = models.TextField()
    city = models.CharField(max_length=100, blank=True, null=True)
    state = models.CharField(max_length=100, blank=True, null=True)
    country = models.CharField(max_length=100, default="Nigeria")
    latitude = models.DecimalField(max_digits=10, decimal_places=8, null=True, blank=True)
    longitude = models.DecimalField(max_digits=11, decimal_places=8, null=True, blank=True)
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    email = models.EmailField(max_length=255, blank=True, null=True)
    website_url = models.CharField(max_length=500, blank=True, null=True)
    instagram_url = models.CharField(max_length=500, blank=True, null=True)
    cover_photo = models.CharField(max_length=500, blank=True, null=True)
    logo_url = models.CharField(max_length=500, blank=True, null=True)
    image = models.ImageField(upload_to="salons/", null=True, blank=True)
    working_hours = models.JSONField(default=dict, blank=True)
    is_verified = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    is_featured = models.BooleanField(default=False)
    average_rating = models.DecimalField(max_digits=3, decimal_places=2, default="0")
    total_reviews = models.IntegerField(default=0)
    seat_capacity = models.IntegerField(default=1)
    current_occupancy = models.IntegerField(default=0)
    busy_percentage = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "salons"
        ordering = ["-created_at"]

    def __str__(self):
        return self.business_name


class Service(models.Model):
    id = models.BigAutoField(primary_key=True)
    salon = models.ForeignKey(
        Salon, on_delete=models.CASCADE, null=True, blank=True, related_name="services"
    )
    stylist = models.ForeignKey(
        Stylist, on_delete=models.CASCADE, null=True, blank=True, related_name="services"
    )
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    category = models.CharField(max_length=100, blank=True, null=True)
    min_price = models.DecimalField(max_digits=10, decimal_places=2)
    max_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    duration_min = models.IntegerField(default=60)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "services"
        ordering = ["-created_at"]

    def __str__(self):
        return self.name


class Product(models.Model):
    class Category(models.TextChoices):
        SERUM = "serum", "Serum"
        SHAMPOO = "shampoo", "Shampoo"
        SUPPLEMENT = "supplement", "Supplement"
        TOOL = "tool", "Tool"
        TREATMENT = "treatment", "Treatment"
        OTHER = "other", "Other"

    id = models.BigAutoField(primary_key=True)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    category = models.CharField(max_length=20, choices=Category.choices, blank=True, null=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    compare_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    stock_quantity = models.IntegerField(default=0)
    sku = models.CharField(max_length=100, blank=True, null=True)
    photos = models.TextField(blank=True, null=True)
    image = models.ImageField(upload_to="products/", null=True, blank=True)
    ingredients = models.TextField(blank=True, null=True)
    usage_guide = models.TextField(blank=True, null=True)
    badge = models.CharField(max_length=50, blank=True, null=True)
    is_new = models.BooleanField(default=False)
    is_featured = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    average_rating = models.DecimalField(max_digits=3, decimal_places=2, default="0")
    total_reviews = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "products"
        ordering = ["-created_at"]

    def __str__(self):
        return self.name


class Hairstyle(models.Model):
    class GenderTarget(models.TextChoices):
        MALE = "male", "Male"
        FEMALE = "female", "Female"
        UNISEX = "unisex", "Unisex"

    id = models.BigAutoField(primary_key=True)
    name = models.CharField(max_length=255)
    category = models.CharField(max_length=100, blank=True, null=True)
    gender_target = models.CharField(
        max_length=20, choices=GenderTarget.choices, default=GenderTarget.UNISEX
    )
    face_shapes = models.TextField(blank=True, null=True)
    hair_types = models.TextField(blank=True, null=True)
    thumbnail_url = models.CharField(max_length=500, blank=True, null=True)
    image = models.ImageField(upload_to="hairstyles/", null=True, blank=True)
    trend_score = models.IntegerField(default=0)
    is_celebrity = models.BooleanField(default=False)
    celebrity_name = models.CharField(max_length=255, blank=True, null=True)
    tags = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "hairstyles"
        ordering = ["-trend_score"]

    def __str__(self):
        return self.name


class Appointment(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        CONFIRMED = "confirmed", "Confirmed"
        IN_PROGRESS = "in_progress", "In Progress"
        COMPLETED = "completed", "Completed"
        CANCELLED_BY_USER = "cancelled_by_user", "Cancelled By User"
        CANCELLED_BY_STYLIST = "cancelled_by_stylist", "Cancelled By Stylist"
        NO_SHOW = "no_show", "No Show"

    class PaymentStatus(models.TextChoices):
        PENDING = "pending", "Pending"
        PAID = "paid", "Paid"
        REFUNDED = "refunded", "Refunded"
        DISPUTED = "disputed", "Disputed"

    id = models.BigAutoField(primary_key=True)
    booking_reference = models.CharField(max_length=12, unique=True)
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, null=True, blank=True, related_name="appointments"
    )
    stylist = models.ForeignKey(
        Stylist, on_delete=models.CASCADE, null=True, blank=True, related_name="appointments"
    )
    salon = models.ForeignKey(
        Salon, on_delete=models.CASCADE, null=True, blank=True, related_name="appointments"
    )
    service = models.ForeignKey(
        Service, on_delete=models.CASCADE, null=True, blank=True, related_name="appointments"
    )
    scheduled_at = models.DateTimeField()
    duration_minutes = models.IntegerField(default=60)
    status = models.CharField(max_length=30, choices=Status.choices, default=Status.PENDING)
    user_notes = models.TextField(blank=True, null=True)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2)
    platform_fee = models.DecimalField(max_digits=12, decimal_places=2)
    stylist_amount = models.DecimalField(max_digits=12, decimal_places=2)
    payment_status = models.CharField(
        max_length=20, choices=PaymentStatus.choices, default=PaymentStatus.PENDING
    )
    cancelled_at = models.DateTimeField(null=True, blank=True)
    cancellation_reason = models.TextField(blank=True, null=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "appointments"
        ordering = ["-created_at"]

    def __str__(self):
        return self.booking_reference


class Review(models.Model):
    class TargetType(models.TextChoices):
        SALON = "salon", "Salon"
        STYLIST = "stylist", "Stylist"
        PRODUCT = "product", "Product"

    id = models.BigAutoField(primary_key=True)
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, null=True, blank=True, related_name="reviews"
    )
    appointment = models.ForeignKey(
        Appointment, on_delete=models.CASCADE, null=True, blank=True, related_name="reviews"
    )
    target_type = models.CharField(max_length=20, choices=TargetType.choices)
    target_id = models.BigIntegerField(null=True, blank=True)
    rating = models.SmallIntegerField(null=True, blank=True)
    title = models.CharField(max_length=255, blank=True, null=True)
    body = models.TextField(blank=True, null=True)
    photos = models.TextField(blank=True, null=True)
    is_verified = models.BooleanField(default=False)
    is_featured = models.BooleanField(default=False)
    helpful_count = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "reviews"
        ordering = ["-created_at"]

    def __str__(self):
        return self.title or f"Review {self.id}"


class CartItem(models.Model):
    id = models.BigAutoField(primary_key=True)
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, null=True, blank=True, related_name="cart_items"
    )
    session_id = models.CharField(max_length=255, blank=True, null=True)
    product = models.ForeignKey(
        Product, on_delete=models.CASCADE, null=True, blank=True, related_name="cart_items"
    )
    quantity = models.IntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "cart_items"

    def __str__(self):
        return f"CartItem {self.id}"


class WishlistItem(models.Model):
    id = models.BigAutoField(primary_key=True)
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, null=True, blank=True, related_name="wishlist_items"
    )
    product = models.ForeignKey(
        Product, on_delete=models.CASCADE, null=True, blank=True, related_name="wishlist_items"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "wishlist_items"

    def __str__(self):
        return f"WishlistItem {self.id}"


class Order(models.Model):
    class OrderStatus(models.TextChoices):
        PENDING = "pending", "Pending"
        PROCESSING = "processing", "Processing"
        SHIPPED = "shipped", "Shipped"
        DELIVERED = "delivered", "Delivered"
        CANCELLED = "cancelled", "Cancelled"

    id = models.BigAutoField(primary_key=True)
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, null=True, blank=True, related_name="orders"
    )
    order_number = models.CharField(max_length=20, unique=True)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2)
    status = models.CharField(
        max_length=20, choices=OrderStatus.choices, default=OrderStatus.PENDING
    )
    shipping_address = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "orders"
        ordering = ["-created_at"]

    def __str__(self):
        return self.order_number


class OrderItem(models.Model):
    id = models.BigAutoField(primary_key=True)
    order = models.ForeignKey(
        Order, on_delete=models.CASCADE, null=True, blank=True, related_name="items"
    )
    product = models.ForeignKey(
        Product, on_delete=models.CASCADE, null=True, blank=True, related_name="order_items"
    )
    quantity = models.IntegerField()
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    total_price = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        db_table = "order_items"

    def __str__(self):
        return f"OrderItem {self.id}"


class Notification(models.Model):
    id = models.BigAutoField(primary_key=True)
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, null=True, blank=True, related_name="notifications"
    )
    type = models.CharField(max_length=100)
    title = models.CharField(max_length=255, blank=True, null=True)
    message = models.TextField(blank=True, null=True)
    data = models.JSONField(default=dict, blank=True)
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "notifications"
        ordering = ["-created_at"]

    def __str__(self):
        return self.title or self.type


class AiRecommendation(models.Model):
    id = models.BigAutoField(primary_key=True)
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, null=True, blank=True, related_name="ai_recommendations"
    )
    face_scan_data = models.JSONField(default=dict, blank=True)
    face_shape = models.CharField(max_length=50, blank=True, null=True)
    skin_tone = models.SmallIntegerField(null=True, blank=True)
    hairline_stage = models.SmallIntegerField(null=True, blank=True)
    recommended_styles = models.TextField(blank=True, null=True)
    model_version = models.CharField(max_length=20, blank=True, null=True)
    scan_image_url = models.CharField(max_length=500, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "ai_recommendations"
        ordering = ["-created_at"]

    def __str__(self):
        return f"AiRecommendation {self.id}"


class Hero(models.Model):
    id = models.BigAutoField(primary_key=True)
    title = models.CharField(max_length=255)
    subtitle = models.TextField(blank=True, null=True)
    image = models.ImageField(upload_to="heroes/", null=True, blank=True)
    is_active = models.BooleanField(default=True)
    order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "heroes"
        ordering = ["order", "-created_at"]

    def __str__(self):
        return self.title
