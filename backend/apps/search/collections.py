SALON_SCHEMA = {
    "name": "salons",
    "fields": [
        {"name": "id", "type": "string"},
        {"name": "business_name", "type": "string", "facet": False},
        {"name": "description", "type": "string", "optional": True},
        {"name": "city", "type": "string", "facet": True},
        {"name": "state", "type": "string", "facet": True},
        {"name": "country", "type": "string", "facet": True},
        {"name": "location", "type": "geopoint", "optional": True},
        {"name": "services", "type": "string[]", "facet": True, "optional": True},
        {"name": "average_rating", "type": "float", "facet": True, "optional": True},
        {"name": "total_reviews", "type": "int32", "optional": True},
        {"name": "is_verified", "type": "bool", "facet": True},
        {"name": "is_active", "type": "bool", "facet": True},
        {"name": "is_featured", "type": "bool", "facet": True},
        {"name": "seat_capacity", "type": "int32", "optional": True},
        {"name": "busy_percentage", "type": "int32", "optional": True},
        {"name": "created_at", "type": "int64"},
    ],
    "default_sorting_field": "created_at",
}

PRODUCT_SCHEMA = {
    "name": "products",
    "fields": [
        {"name": "id", "type": "string"},
        {"name": "name", "type": "string", "facet": False},
        {"name": "description", "type": "string", "optional": True},
        {"name": "category", "type": "string", "facet": True},
        {"name": "price", "type": "float", "facet": True},
        {"name": "compare_price", "type": "float", "facet": True, "optional": True},
        {"name": "stock_quantity", "type": "int32", "optional": True},
        {"name": "sku", "type": "string", "optional": True},
        {"name": "ingredients", "type": "string[]", "facet": True, "optional": True},
        {"name": "badge", "type": "string", "facet": True, "optional": True},
        {"name": "is_new", "type": "bool", "facet": True},
        {"name": "is_featured", "type": "bool", "facet": True},
        {"name": "is_active", "type": "bool", "facet": True},
        {"name": "average_rating", "type": "float", "facet": True, "optional": True},
        {"name": "total_reviews", "type": "int32", "optional": True},
        {"name": "created_at", "type": "int64"},
    ],
    "default_sorting_field": "created_at",
}

STYLIST_SCHEMA = {
    "name": "stylists",
    "fields": [
        {"name": "id", "type": "string"},
        {"name": "display_name", "type": "string", "facet": False},
        {"name": "bio", "type": "string", "optional": True},
        {"name": "specializations", "type": "string[]", "facet": True, "optional": True},
        {"name": "service_categories", "type": "string[]", "facet": True, "optional": True},
        {"name": "years_experience", "type": "int32", "optional": True},
        {"name": "average_rating", "type": "float", "facet": True, "optional": True},
        {"name": "total_reviews", "type": "int32", "optional": True},
        {"name": "kyc_status", "type": "string", "facet": True},
        {"name": "subscription_plan", "type": "string", "facet": True},
        {"name": "is_featured", "type": "bool", "facet": True},
        {"name": "is_mobile", "type": "bool", "facet": True, "optional": True},
        {"name": "created_at", "type": "int64"},
    ],
    "default_sorting_field": "created_at",
}

HAIRSTYLE_SCHEMA = {
    "name": "hairstyles",
    "fields": [
        {"name": "id", "type": "string"},
        {"name": "name", "type": "string", "facet": False},
        {"name": "category", "type": "string", "facet": True, "optional": True},
        {"name": "gender_target", "type": "string", "facet": True},
        {"name": "face_shapes", "type": "string[]", "facet": True, "optional": True},
        {"name": "hair_types", "type": "string[]", "facet": True, "optional": True},
        {"name": "tags", "type": "string[]", "facet": True, "optional": True},
        {"name": "trend_score", "type": "int32", "facet": True},
        {"name": "is_celebrity", "type": "bool", "facet": True},
        {"name": "celebrity_name", "type": "string", "optional": True},
        {"name": "created_at", "type": "int64"},
    ],
    "default_sorting_field": "trend_score",
}

ALL_SCHEMAS = [SALON_SCHEMA, PRODUCT_SCHEMA, STYLIST_SCHEMA, HAIRSTYLE_SCHEMA]
