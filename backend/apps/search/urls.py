from django.urls import path

from apps.search.views import (
    GlobalSearchView,
    HairstyleSearchView,
    ProductSearchView,
    SalonSearchView,
    StylistSearchView,
)

urlpatterns = [
    path("salons", SalonSearchView.as_view(), name="search-salons"),
    path("products", ProductSearchView.as_view(), name="search-products"),
    path("stylists", StylistSearchView.as_view(), name="search-stylists"),
    path("hairstyles", HairstyleSearchView.as_view(), name="search-hairstyles"),
    path("global", GlobalSearchView.as_view(), name="search-global"),
]
