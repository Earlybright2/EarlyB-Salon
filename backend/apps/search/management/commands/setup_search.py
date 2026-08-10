from django.core.management.base import BaseCommand

from apps.search.collections import ALL_SCHEMAS
from config.typesense_client import get_typesense_client


class Command(BaseCommand):
    help = "Create or recreate Typesense collections"

    def handle(self, *args, **options):
        client = get_typesense_client()
        for schema in ALL_SCHEMAS:
            name = schema["name"]
            try:
                client.collections[name].delete()
                self.stdout.write(self.style.WARNING(f"Deleted existing: {name}"))
            except Exception:
                pass
            client.collections.create(schema)
            self.stdout.write(self.style.SUCCESS(f"Created: {name}"))
