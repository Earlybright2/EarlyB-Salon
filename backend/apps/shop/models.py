from django.conf import settings
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.contrib.postgres.fields import ArrayField
from django.core.exceptions import ValidationError
from django.db import models
from django.db.models.signals import post_delete
from django.dispatch import receiver

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
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True, related_name="stylists")
    display_name = models.CharField(max_length=255, blank=True, null=True)
    bio = models.TextField(blank=True, null=True)
    years_experience = models.IntegerField(null=True, blank=True)
    specializations = ArrayField(models.CharField(max_length=100), default=list, blank=True)
    service_categories = ArrayField(models.CharField(max_length=100), default=list, blank=True)
    face_shapes = ArrayField(models.CharField(max_length=50), default=list, blank=True)
    hair_types = ArrayField(models.CharField(max_length=50), default=list, blank=True)
    tags = ArrayField(models.CharField(max_length=100), default=list, blank=True)
    working_hours = models.JSONField(default=dict, blank=True)
    is_mobile = models.BooleanField(default=False)
    kyc_status = models.CharField(max_length=20, choices=KycStatus.choices, default=KycStatus.PENDING)
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
    subscription_plan = models.CharField(max_length=20, choices=SubscriptionPlan.choices, default=SubscriptionPlan.FREE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "stylists"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user"], name="stylist_user_idx"),
            models.Index(fields=["is_featured"], name="stylist_featured_idx"),
            models.Index(fields=["subscription_plan"], name="stylist_plan_idx"),
            models.Index(fields=["average_rating"], name="stylist_rating_idx"),
            models.Index(fields=["kyc_status"], name="stylist_kyc_idx"),
        ]

    def __str__(self):
        return self.display_name or f"Stylist {self.id}"


class Salon(models.Model):
    id = models.BigAutoField(primary_key=True)
    owner = models.ForeignKey(Stylist, on_delete=models.CASCADE, null=True, blank=True, related_name="owned_salons")
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
    service_categories = ArrayField(models.CharField(max_length=100), default=list, blank=True)
    tags = ArrayField(models.CharField(max_length=100), default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "salons"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["owner"], name="salon_owner_idx"),
            models.Index(fields=["city", "state", "country"], name="salon_location_idx"),
            models.Index(fields=["is_active", "is_verified"], name="salon_active_verified_idx"),
            models.Index(fields=["average_rating"], name="salon_rating_idx"),
        ]

    def __str__(self):
        return self.business_name


class Service(models.Model):
    id = models.BigAutoField(primary_key=True)
    salon = models.ForeignKey(Salon, on_delete=models.CASCADE, null=True, blank=True, related_name="services")
    stylist = models.ForeignKey(Stylist, on_delete=models.CASCADE, null=True, blank=True, related_name="services")
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
        indexes = [
            models.Index(fields=["category", "is_active"], name="product_cat_active_idx"),
            models.Index(fields=["is_featured", "is_active"], name="product_featured_active_idx"),
            models.Index(fields=["price"], name="product_price_idx"),
            models.Index(fields=["created_at"], name="product_created_idx"),
        ]
        constraints = [
            models.CheckConstraint(check=models.Q(price__gte=0), name="product_price_nonnegative"),
            models.CheckConstraint(check=models.Q(stock_quantity__gte=0), name="product_stock_nonnegative"),
        ]

    def __str__(self):
        return self.name


class ProductImage(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="images")
    image_url = models.URLField()
    alt_text = models.CharField(max_length=255, blank=True)
    display_order = models.PositiveSmallIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "product_images"
        ordering = ["display_order"]

    def __str__(self):
        return f"ProductImage {self.id} for product {self.product_id}"


class Hairstyle(models.Model):
    class GenderTarget(models.TextChoices):
        MALE = "male", "Male"
        FEMALE = "female", "Female"
        UNISEX = "unisex", "Unisex"

    id = models.BigAutoField(primary_key=True)
    name = models.CharField(max_length=255)
    category = models.CharField(max_length=100, blank=True, null=True)
    gender_target = models.CharField(max_length=20, choices=GenderTarget.choices, default=GenderTarget.UNISEX)
    face_shapes = ArrayField(models.CharField(max_length=50), default=list, blank=True)
    hair_types = ArrayField(models.CharField(max_length=50), default=list, blank=True)
    thumbnail_url = models.CharField(max_length=500, blank=True, null=True)
    image = models.ImageField(upload_to="hairstyles/", null=True, blank=True)
    trend_score = models.IntegerField(default=0)
    is_celebrity = models.BooleanField(default=False)
    celebrity_name = models.CharField(max_length=255, blank=True, null=True)
    tags = ArrayField(models.CharField(max_length=100), default=list, blank=True)
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
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True, related_name="appointments")
    stylist = models.ForeignKey(Stylist, on_delete=models.CASCADE, null=True, blank=True, related_name="appointments")
    salon = models.ForeignKey(Salon, on_delete=models.CASCADE, null=True, blank=True, related_name="appointments")
    service = models.ForeignKey(Service, on_delete=models.CASCADE, null=True, blank=True, related_name="appointments")
    scheduled_at = models.DateTimeField()
    duration_minutes = models.IntegerField(default=60)
    status = models.CharField(max_length=30, choices=Status.choices, default=Status.PENDING)
    user_notes = models.TextField(blank=True, null=True)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2)
    platform_fee = models.DecimalField(max_digits=12, decimal_places=2)
    stylist_amount = models.DecimalField(max_digits=12, decimal_places=2)
    payment_status = models.CharField(max_length=20, choices=PaymentStatus.choices, default=PaymentStatus.PENDING)
    cancelled_at = models.DateTimeField(null=True, blank=True)
    cancellation_reason = models.TextField(blank=True, null=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "appointments"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["booking_reference"], name="appt_ref_idx"),
            models.Index(fields=["user", "status"], name="appt_user_status_idx"),
            models.Index(fields=["stylist", "scheduled_at"], name="appt_stylist_time_idx"),
            models.Index(fields=["status", "payment_status"], name="appt_status_pay_idx"),
            models.Index(fields=["scheduled_at"], name="appt_time_idx"),
        ]
        constraints = [
            models.CheckConstraint(check=models.Q(total_amount__gte=0), name="appt_amount_nonnegative"),
            models.CheckConstraint(check=models.Q(duration_minutes__gte=15), name="appt_min_duration"),
        ]

    def __str__(self):
        return self.booking_reference


class Review(models.Model):
    id = models.BigAutoField(primary_key=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True, related_name="reviews")
    appointment = models.ForeignKey(Appointment, on_delete=models.CASCADE, null=True, blank=True, related_name="reviews")
    target_type = models.CharField(max_length=20, blank=True, null=True)
    target_id = models.BigIntegerField(null=True, blank=True)
    target_content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE, null=True, blank=True)
    target_object_id = models.PositiveIntegerField(null=True, blank=True)
    target = GenericForeignKey("target_content_type", "target_object_id")
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
        indexes = [
            models.Index(fields=["target_content_type", "target_object_id"], name="review_target_idx"),
            models.Index(fields=["user", "created_at"], name="review_user_created_idx"),
            models.Index(fields=["rating"], name="review_rating_idx"),
        ]
        constraints = [
            models.CheckConstraint(
                check=models.Q(rating__gte=1, rating__lte=5) | models.Q(rating__isnull=True),
                name="review_rating_range",
            ),
        ]

    def clean(self):
        if self.rating is not None and not (1 <= self.rating <= 5):
            raise ValidationError("Rating must be between 1 and 5.")

    def __str__(self):
        return self.title or f"Review {self.id}"


@receiver(post_delete, sender=Salon)
def delete_salon_reviews(sender, instance, **kwargs):
    Review.objects.filter(
        target_content_type=ContentType.objects.get_for_model(Salon),
        target_object_id=instance.id,
    ).delete()


@receiver(post_delete, sender=Stylist)
def delete_stylist_reviews(sender, instance, **kwargs):
    Review.objects.filter(
        target_content_type=ContentType.objects.get_for_model(Stylist),
        target_object_id=instance.id,
    ).delete()


@receiver(post_delete, sender=Product)
def delete_product_reviews(sender, instance, **kwargs):
    Review.objects.filter(
        target_content_type=ContentType.objects.get_for_model(Product),
        target_object_id=instance.id,
    ).delete()


class CartItem(models.Model):
    id = models.BigAutoField(primary_key=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True, related_name="cart_items")
    session_id = models.CharField(max_length=255, blank=True, null=True)
    product = models.ForeignKey(Product, on_delete=models.CASCADE, null=True, blank=True, related_name="cart_items")
    quantity = models.IntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "cart_items"

    def __str__(self):
        return f"CartItem {self.id}"


class WishlistItem(models.Model):
    id = models.BigAutoField(primary_key=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True, related_name="wishlist_items")
    product = models.ForeignKey(Product, on_delete=models.CASCADE, null=True, blank=True, related_name="wishlist_items")
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
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True, related_name="orders")
    order_number = models.CharField(max_length=20, unique=True)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2)
    status = models.CharField(max_length=20, choices=OrderStatus.choices, default=OrderStatus.PENDING)
    shipping_address = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "orders"
        ordering = ["-created_at"]

    def __str__(self):
        return self.order_number


class OrderItem(models.Model):
    id = models.BigAutoField(primary_key=True)
    order = models.ForeignKey(Order, on_delete=models.CASCADE, null=True, blank=True, related_name="items")
    product = models.ForeignKey(Product, on_delete=models.CASCADE, null=True, blank=True, related_name="order_items")
    quantity = models.IntegerField()
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    total_price = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        db_table = "order_items"

    def __str__(self):
        return f"OrderItem {self.id}"


class Notification(models.Model):
    id = models.BigAutoField(primary_key=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True, related_name="notifications")
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
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True, related_name="ai_recommendations")
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
