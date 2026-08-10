"""Data integrity: GFK cascade, constraints, ProductImage."""

import pytest
from django.contrib.contenttypes.models import ContentType
from django.core.exceptions import ValidationError
from django.db import IntegrityError

from apps.shop.models import Product, ProductImage, Review, Salon
from apps.users.models import User


@pytest.mark.django_db
class TestReviewIntegrity:
    def test_rating_clean_rejects_invalid(self):
        user = User.objects.create_user(
            union_id="email:r@example.com", email="r@example.com", password="StrongPass123!"
        )
        review = Review(user=user, rating=9, body="bad")
        with pytest.raises(ValidationError):
            review.clean()

    def test_salon_delete_cascades_reviews(self):
        user = User.objects.create_user(
            union_id="email:s@example.com", email="s@example.com", password="StrongPass123!"
        )
        salon = Salon.objects.create(business_name="Test Salon", address="1 Road")
        ct = ContentType.objects.get_for_model(Salon)
        Review.objects.create(
            user=user,
            rating=5,
            body="great",
            target_content_type=ct,
            target_object_id=salon.id,
        )
        assert Review.objects.count() == 1
        salon.delete()
        assert Review.objects.count() == 0


@pytest.mark.django_db
class TestProductConstraints:
    def test_negative_price_raises(self):
        with pytest.raises(IntegrityError):
            Product.objects.create(name="Bad", price=-1, stock_quantity=1)

    def test_product_image_related(self):
        product = Product.objects.create(name="Serum", price=10, stock_quantity=5)
        ProductImage.objects.create(
            product=product, image_url="https://example.com/a.jpg", display_order=0
        )
        assert product.images.count() == 1
