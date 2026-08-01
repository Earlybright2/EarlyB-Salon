from django.urls import path

from apps.shop import views

urlpatterns = [
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
]
