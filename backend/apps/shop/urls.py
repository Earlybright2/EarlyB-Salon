from django.urls import path

from apps.shop import commerce_views, views

urlpatterns = [
    # Catalog (public)
    path("heroes", views.HeroesListView.as_view(), name="shop-heroes"),
    path("products", views.ProductsListView.as_view(), name="shop-products"),
    path("products/featured", views.FeaturedProductsView.as_view(), name="shop-products-featured"),
    path(
        "products/by-category/<str:category>",
        views.ProductsByCategoryView.as_view(),
        name="shop-products-by-category",
    ),
    path("products/<int:pk>", views.ProductDetailView.as_view(), name="shop-product-detail"),
    path("salons", views.SalonsListView.as_view(), name="shop-salons"),
    path("salons/featured", views.FeaturedSalonsView.as_view(), name="shop-salons-featured"),
    path("salons/<int:pk>", views.SalonDetailView.as_view(), name="shop-salon-detail"),
    path("salons/<int:pk>/services", views.SalonServicesView.as_view(), name="shop-salon-services"),
    path("hairstyles", views.HairstylesListView.as_view(), name="shop-hairstyles"),
    path(
        "hairstyles/<int:pk>",
        views.HairstyleDetailView.as_view(),
        name="shop-hairstyle-detail",
    ),
    # Bookings / appointments
    path(
        "appointments",
        commerce_views.AppointmentListCreateView.as_view(),
        name="shop-appointments",
    ),
    path(
        "appointments/<int:pk>",
        commerce_views.AppointmentDetailView.as_view(),
        name="shop-appointment-detail",
    ),
    path(
        "appointments/<int:pk>/cancel",
        commerce_views.AppointmentCancelView.as_view(),
        name="shop-appointment-cancel",
    ),
    # Cart
    path("cart", commerce_views.CartListView.as_view(), name="shop-cart"),
    path("cart/add", commerce_views.CartAddView.as_view(), name="shop-cart-add"),
    path("cart/clear", commerce_views.CartClearView.as_view(), name="shop-cart-clear"),
    path(
        "cart/items/<int:pk>",
        commerce_views.CartItemUpdateView.as_view(),
        name="shop-cart-item",
    ),
    # Wishlist
    path("wishlist", commerce_views.WishlistListView.as_view(), name="shop-wishlist"),
    path("wishlist/add", commerce_views.WishlistAddView.as_view(), name="shop-wishlist-add"),
    path(
        "wishlist/<int:pk>",
        commerce_views.WishlistRemoveView.as_view(),
        name="shop-wishlist-remove",
    ),
    # Orders / checkout (no payment gateway)
    path("orders", commerce_views.OrderListView.as_view(), name="shop-orders"),
    path("orders/checkout", commerce_views.CheckoutView.as_view(), name="shop-checkout"),
    path("orders/<int:pk>", commerce_views.OrderDetailView.as_view(), name="shop-order-detail"),
    path(
        "orders/<int:pk>/cancel",
        commerce_views.OrderCancelView.as_view(),
        name="shop-order-cancel",
    ),
    # Reviews
    path("reviews", commerce_views.ReviewListView.as_view(), name="shop-reviews-list"),
    path("reviews/create", commerce_views.ReviewCreateView.as_view(), name="shop-reviews-create"),
    # Notifications
    path(
        "notifications",
        commerce_views.NotificationListView.as_view(),
        name="shop-notifications",
    ),
    path(
        "notifications/read-all",
        commerce_views.NotificationMarkReadView.as_view(),
        name="shop-notifications-read-all",
    ),
    path(
        "notifications/<int:pk>/read",
        commerce_views.NotificationMarkReadView.as_view(),
        name="shop-notification-read",
    ),
    # Admin product CRUD
    path(
        "admin/products",
        commerce_views.AdminProductCreateView.as_view(),
        name="shop-admin-product-create",
    ),
    path(
        "admin/products/<int:pk>",
        commerce_views.AdminProductUpdateView.as_view(),
        name="shop-admin-product-update",
    ),
]
