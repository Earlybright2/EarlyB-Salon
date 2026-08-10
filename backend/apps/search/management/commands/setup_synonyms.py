from django.core.management.base import BaseCommand

from apps.search.synonyms import SYNONYMS
from config.typesense_client import get_typesense_client


class Command(BaseCommand):
    help = "Upload synonyms to Typesense collections"

    def handle(self, *args, **options):
        client = get_typesense_client()
        collections = ["salons", "products", "stylists", "hairstyles"]
        for coll in collections:
            for syn in SYNONYMS:
                try:
                    client.collections[coll].synonyms.upsert(syn["id"], syn)
                except Exception as e:
                    self.stdout.write(self.style.WARNING(f"Failed for {coll}: {e}"))
            self.stdout.write(self.style.SUCCESS(f"Synonyms uploaded for {coll}"))
