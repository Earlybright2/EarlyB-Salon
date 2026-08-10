import typesense
from django.conf import settings


def get_typesense_client():
    return typesense.Client(
        {
            "nodes": [
                {
                    "host": settings.TYPESENSE_HOST,
                    "port": settings.TYPESENSE_PORT,
                    "protocol": settings.TYPESENSE_PROTOCOL,
                }
            ],
            "api_key": settings.TYPESENSE_API_KEY,
            "connection_timeout_seconds": 2,
        }
    )
