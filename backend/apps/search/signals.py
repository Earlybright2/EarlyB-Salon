"""Auto-index shop entities into Typesense on save/delete.

Failures are swallowed so ORM writes never crash if Typesense is down.
"""

from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver

from apps.search.mappers import (
    hairstyle_to_document,
    product_to_document,
    salon_to_document,
    stylist_to_document,
)
from apps.shop.models import Hairstyle, Product, Salon, Stylist


def _client():
    from config.typesense_client import get_typesense_client

    return get_typesense_client()


def _upsert(collection: str, document: dict) -> None:
    try:
        _client().collections[collection].documents.upsert(document)
    except Exception:
        pass


def _delete(collection: str, doc_id: str) -> None:
    try:
        _client().collections[collection].documents[doc_id].delete()
    except Exception:
        pass


@receiver(post_save, sender=Salon)
def index_salon(sender, instance, **kwargs):
    if instance.is_active:
        _upsert("salons", salon_to_document(instance))
    else:
        _delete("salons", str(instance.id))


@receiver(post_delete, sender=Salon)
def remove_salon(sender, instance, **kwargs):
    _delete("salons", str(instance.id))


@receiver(post_save, sender=Product)
def index_product(sender, instance, **kwargs):
    if instance.is_active:
        _upsert("products", product_to_document(instance))
    else:
        _delete("products", str(instance.id))


@receiver(post_delete, sender=Product)
def remove_product(sender, instance, **kwargs):
    _delete("products", str(instance.id))


@receiver(post_save, sender=Stylist)
def index_stylist(sender, instance, **kwargs):
    _upsert("stylists", stylist_to_document(instance))


@receiver(post_delete, sender=Stylist)
def remove_stylist(sender, instance, **kwargs):
    _delete("stylists", str(instance.id))


@receiver(post_save, sender=Hairstyle)
def index_hairstyle(sender, instance, **kwargs):
    _upsert("hairstyles", hairstyle_to_document(instance))


@receiver(post_delete, sender=Hairstyle)
def remove_hairstyle(sender, instance, **kwargs):
    _delete("hairstyles", str(instance.id))
