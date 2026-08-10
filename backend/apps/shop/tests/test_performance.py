"""Basic index / query smoke tests."""

import pytest
from django.db import connection
from django.test.utils import CaptureQueriesContext

from apps.shop.models import Product


@pytest.mark.django_db
class TestQuerySmoke:
    def test_featured_products_query_runs(self):
        Product.objects.create(name="A", price=1, stock_quantity=1, is_featured=True, is_active=True)
        with CaptureQueriesContext(connection) as ctx:
            list(Product.objects.filter(is_featured=True, is_active=True))
        assert len(ctx) >= 1
