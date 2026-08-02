from django import forms
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


class ProductAdminForm(forms.ModelForm):
    class Meta:
        model = Product
        fields = "__all__"

    def clean_average_rating(self):
        rating = self.cleaned_data.get("average_rating")
        if rating is None:
            return rating
        rating = float(rating)
        if rating < 1.0 or rating > 5.0:
            raise forms.ValidationError("Rating must be between 1.0 and 5.0.")
        return rating


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
        "city",
        "busy_percentage",
        "is_featured",
        "is_verified",
        "is_active",
    )
    list_editable = ("busy_percentage", "is_featured", "is_verified", "is_active")
    list_filter = ("is_featured", "is_verified", "is_active", "city")
    search_fields = ("business_name", "address", "city")
    ordering = ("-created_at",)
    fieldsets = (
        (
            None,
            {
                "fields": (
                    "business_name",
                    "description",
                    "image",
                    "address",
                    "city",
                    "state",
                    "country",
                    "phone_number",
                    "email",
                )
            },
        ),
        ("Status", {"fields": ("is_verified", "is_active", "is_featured", "busy_percentage")}),
        ("Occupancy", {"fields": ("seat_capacity", "current_occupancy")}),
    )


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    form = ProductAdminForm
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
    fieldsets = (
        (
            None,
            {
                "fields": (
                    "name",
                    "description",
                    "image",
                    "category",
                    "price",
                    "compare_price",
                    "average_rating",
                    "badge",
                )
            },
        ),
        ("Inventory", {"fields": ("stock_quantity", "sku")}),
        ("Flags", {"fields": ("is_new", "is_featured", "is_active")}),
    )


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
    fieldsets = (
        (
            None,
            {
                "fields": (
                    "name",
                    "image",
                    "category",
                    "gender_target",
                    "trend_score",
                )
            },
        ),
        ("Details", {"fields": ("face_shapes", "hair_types", "tags", "thumbnail_url")}),
        ("Celebrity", {"fields": ("is_celebrity", "celebrity_name")}),
    )


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
