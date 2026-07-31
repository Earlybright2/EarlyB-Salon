from django.contrib import admin

from apps.shop.models import (
    AiRecommendation,
    Appointment,
    CartItem,
    Hairstyle,
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

admin.site.register(
    [
        Stylist,
        Salon,
        Service,
        Product,
        Hairstyle,
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
