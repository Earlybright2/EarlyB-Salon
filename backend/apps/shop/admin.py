from django.contrib import admin

from apps.shop.models import (
    AiRecommendation,
    Appointment,
    CartItem,
    Hairstyle,
    Hero,
    Notification,
    Order,
    OrderItem,
    Product,
    Review,
    Salon,
    Service,
    Stylist,
    WishlistItem,
)

@admin.register(Hero)
class HeroAdmin(admin.ModelAdmin):
    list_display = ("title", "is_active", "order", "created_at")
    list_editable = ("is_active", "order")
    list_filter = ("is_active",)
    ordering = ("order",)


@admin.register(Salon)
class SalonAdmin(admin.ModelAdmin):
    list_display = (
        "business_name",
        "address",
        "busy_percentage",
        "is_featured",
        "is_verified",
        "is_active",
        "average_rating",
    )
    list_editable = ("busy_percentage", "is_featured", "is_verified", "is_active")
    list_filter = ("is_featured", "is_verified", "is_active", "city")
    search_fields = ("business_name", "address", "city")
    ordering = ("-created_at",)


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "category",
        "price",
        "average_rating",
        "is_featured",
        "is_active",
        "stock_quantity",
    )
    list_editable = ("price", "average_rating", "is_featured", "is_active", "stock_quantity")
    list_filter = ("category", "is_featured", "is_active", "is_new")
    search_fields = ("name", "sku")
    ordering = ("-created_at",)


@admin.register(Hairstyle)
class HairstyleAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "category",
        "gender_target",
        "trend_score",
        "is_celebrity",
        "celebrity_name",
    )
    list_editable = ("gender_target", "trend_score", "is_celebrity", "celebrity_name")
    list_filter = ("gender_target", "category", "is_celebrity")
    search_fields = ("name", "category", "celebrity_name")
    ordering = ("-trend_score",)


admin.site.register(
    [
        Stylist,
        Service,
        Appointment,
        Review,
        CartItem,
        WishlistItem,
        Order,
        OrderItem,
        Notification,
        AiRecommendation,
    ]
)
