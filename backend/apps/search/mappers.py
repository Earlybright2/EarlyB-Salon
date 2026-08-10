"""Map Django shop models to Typesense documents.

Supports both ArrayField (Phase 0) and legacy comma-separated TextField values.
"""


def _as_list(value):
    if value is None:
        return []
    if isinstance(value, (list, tuple)):
        return [str(v).strip() for v in value if str(v).strip()]
    return [s.strip() for s in str(value).split(",") if s.strip()]


def salon_to_document(salon):
    services = list(salon.services.filter(is_active=True).values_list("name", flat=True))
    loc = None
    if salon.latitude is not None and salon.longitude is not None:
        loc = [float(salon.latitude), float(salon.longitude)]

    return {
        "id": str(salon.id),
        "business_name": salon.business_name or "",
        "description": salon.description or "",
        "city": salon.city or "",
        "state": salon.state or "",
        "country": salon.country or "Nigeria",
        "location": loc,
        "services": services,
        "average_rating": float(salon.average_rating or 0),
        "total_reviews": int(salon.total_reviews or 0),
        "is_verified": bool(salon.is_verified),
        "is_active": bool(salon.is_active),
        "is_featured": bool(salon.is_featured),
        "seat_capacity": int(salon.seat_capacity or 1),
        "busy_percentage": int(salon.busy_percentage or 0),
        "created_at": int(salon.created_at.timestamp()) if salon.created_at else 0,
    }


def product_to_document(product):
    ingredients = _as_list(product.ingredients)
    return {
        "id": str(product.id),
        "name": product.name or "",
        "description": product.description or "",
        "category": product.category or "other",
        "price": float(product.price or 0),
        "compare_price": float(product.compare_price) if product.compare_price is not None else None,
        "stock_quantity": int(product.stock_quantity or 0),
        "sku": product.sku or "",
        "ingredients": ingredients,
        "badge": product.badge or "",
        "is_new": bool(product.is_new),
        "is_featured": bool(product.is_featured),
        "is_active": bool(product.is_active),
        "average_rating": float(product.average_rating or 0),
        "total_reviews": int(product.total_reviews or 0),
        "created_at": int(product.created_at.timestamp()) if product.created_at else 0,
    }


def stylist_to_document(stylist):
    return {
        "id": str(stylist.id),
        "display_name": stylist.display_name or f"Stylist {stylist.id}",
        "bio": stylist.bio or "",
        "specializations": _as_list(stylist.specializations),
        "service_categories": _as_list(stylist.service_categories),
        "years_experience": int(stylist.years_experience or 0),
        "average_rating": float(stylist.average_rating or 0),
        "total_reviews": int(stylist.total_reviews or 0),
        "kyc_status": stylist.kyc_status or "pending",
        "subscription_plan": stylist.subscription_plan or "free",
        "is_featured": bool(stylist.is_featured),
        "is_mobile": bool(getattr(stylist, "is_mobile", False)),
        "created_at": int(stylist.created_at.timestamp()) if stylist.created_at else 0,
    }


def hairstyle_to_document(hairstyle):
    return {
        "id": str(hairstyle.id),
        "name": hairstyle.name or "",
        "category": hairstyle.category or "",
        "gender_target": hairstyle.gender_target or "unisex",
        "face_shapes": _as_list(hairstyle.face_shapes),
        "hair_types": _as_list(hairstyle.hair_types),
        "tags": _as_list(hairstyle.tags),
        "trend_score": int(hairstyle.trend_score or 0),
        "is_celebrity": bool(hairstyle.is_celebrity),
        "celebrity_name": hairstyle.celebrity_name or "",
        "created_at": int(hairstyle.created_at.timestamp()) if hairstyle.created_at else 0,
    }
