import django.contrib.postgres.fields
import django.db.models.deletion
from django.db import migrations, models


def split_csv(value):
    if value is None:
        return []
    if isinstance(value, list):
        return value
    try:
        import json
        parsed = json.loads(value)
        if isinstance(parsed, list):
            return [str(x).strip() for x in parsed if str(x).strip()]
    except Exception:
        pass
    return [x.strip() for x in str(value).split(",") if x.strip()]


def forwards_arrays_and_images(apps, schema_editor):
    Stylist = apps.get_model("shop", "Stylist")
    Hairstyle = apps.get_model("shop", "Hairstyle")
    Product = apps.get_model("shop", "Product")
    ProductImage = apps.get_model("shop", "ProductImage")
    Review = apps.get_model("shop", "Review")
    ContentType = apps.get_model("contenttypes", "ContentType")

    for s in Stylist.objects.all():
        for field in ("specializations", "service_categories", "face_shapes", "hair_types", "tags"):
            raw = getattr(s, field, None)
            if isinstance(raw, str):
                setattr(s, field, split_csv(raw))
        s.save()

    for h in Hairstyle.objects.all():
        for field in ("face_shapes", "hair_types", "tags"):
            raw = getattr(h, field, None)
            if isinstance(raw, str):
                setattr(h, field, split_csv(raw))
        h.save()

    if hasattr(Product, "photos"):
        for product in Product.objects.all():
            photos = getattr(product, "photos", None)
            items = split_csv(photos) if photos else []
            for idx, url in enumerate(items):
                if url:
                    ProductImage.objects.create(
                        product=product,
                        image_url=url if url.startswith("http") else f"https://placeholder.local/{url}",
                        display_order=idx,
                    )

    model_map = {
        "salon": ("shop", "salon"),
        "stylist": ("shop", "stylist"),
        "product": ("shop", "product"),
    }
    for review in Review.objects.all():
        t = (review.target_type or "").lower()
        if t in model_map and review.target_id:
            app_label, model = model_map[t]
            try:
                ct = ContentType.objects.get(app_label=app_label, model=model)
            except ContentType.DoesNotExist:
                continue
            review.target_content_type = ct
            review.target_object_id = int(review.target_id)
            review.save(update_fields=["target_content_type", "target_object_id"])


def backwards_noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):
    dependencies = [
        ("contenttypes", "0002_remove_content_type_name"),
        ("shop", "0005_stylist_business_certificate_stylist_government_id_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="stylist",
            name="face_shapes",
            field=django.contrib.postgres.fields.ArrayField(
                base_field=models.CharField(max_length=50), blank=True, default=list, size=None,
            ),
        ),
        migrations.AddField(
            model_name="stylist",
            name="hair_types",
            field=django.contrib.postgres.fields.ArrayField(
                base_field=models.CharField(max_length=50), blank=True, default=list, size=None,
            ),
        ),
        migrations.AddField(
            model_name="stylist",
            name="tags",
            field=django.contrib.postgres.fields.ArrayField(
                base_field=models.CharField(max_length=100), blank=True, default=list, size=None,
            ),
        ),
        migrations.AlterField(
            model_name="stylist",
            name="specializations",
            field=django.contrib.postgres.fields.ArrayField(
                base_field=models.CharField(max_length=100), blank=True, default=list, size=None,
            ),
        ),
        migrations.AlterField(
            model_name="stylist",
            name="service_categories",
            field=django.contrib.postgres.fields.ArrayField(
                base_field=models.CharField(max_length=100), blank=True, default=list, size=None,
            ),
        ),
        migrations.AddField(
            model_name="salon",
            name="service_categories",
            field=django.contrib.postgres.fields.ArrayField(
                base_field=models.CharField(max_length=100), blank=True, default=list, size=None,
            ),
        ),
        migrations.AddField(
            model_name="salon",
            name="tags",
            field=django.contrib.postgres.fields.ArrayField(
                base_field=models.CharField(max_length=100), blank=True, default=list, size=None,
            ),
        ),
        migrations.AlterField(
            model_name="hairstyle",
            name="face_shapes",
            field=django.contrib.postgres.fields.ArrayField(
                base_field=models.CharField(max_length=50), blank=True, default=list, size=None,
            ),
        ),
        migrations.AlterField(
            model_name="hairstyle",
            name="hair_types",
            field=django.contrib.postgres.fields.ArrayField(
                base_field=models.CharField(max_length=50), blank=True, default=list, size=None,
            ),
        ),
        migrations.AlterField(
            model_name="hairstyle",
            name="tags",
            field=django.contrib.postgres.fields.ArrayField(
                base_field=models.CharField(max_length=100), blank=True, default=list, size=None,
            ),
        ),
        migrations.CreateModel(
            name="ProductImage",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("image_url", models.URLField()),
                ("alt_text", models.CharField(blank=True, max_length=255)),
                ("display_order", models.PositiveSmallIntegerField(default=0)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "product",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="images",
                        to="shop.product",
                    ),
                ),
            ],
            options={"db_table": "product_images", "ordering": ["display_order"]},
        ),
        migrations.AddField(
            model_name="review",
            name="target_content_type",
            field=models.ForeignKey(
                blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, to="contenttypes.contenttype",
            ),
        ),
        migrations.AddField(
            model_name="review",
            name="target_object_id",
            field=models.PositiveIntegerField(blank=True, null=True),
        ),
        migrations.AlterField(
            model_name="review",
            name="target_type",
            field=models.CharField(blank=True, max_length=20, null=True),
        ),
        migrations.RunPython(forwards_arrays_and_images, backwards_noop),
        migrations.RemoveField(model_name="product", name="photos"),
        migrations.AddIndex(model_name="stylist", index=models.Index(fields=["user"], name="stylist_user_idx")),
        migrations.AddIndex(model_name="stylist", index=models.Index(fields=["is_featured"], name="stylist_featured_idx")),
        migrations.AddIndex(model_name="stylist", index=models.Index(fields=["subscription_plan"], name="stylist_plan_idx")),
        migrations.AddIndex(model_name="stylist", index=models.Index(fields=["average_rating"], name="stylist_rating_idx")),
        migrations.AddIndex(model_name="stylist", index=models.Index(fields=["kyc_status"], name="stylist_kyc_idx")),
        migrations.AddIndex(model_name="salon", index=models.Index(fields=["owner"], name="salon_owner_idx")),
        migrations.AddIndex(model_name="salon", index=models.Index(fields=["city", "state", "country"], name="salon_location_idx")),
        migrations.AddIndex(model_name="salon", index=models.Index(fields=["is_active", "is_verified"], name="salon_active_verified_idx")),
        migrations.AddIndex(model_name="salon", index=models.Index(fields=["average_rating"], name="salon_rating_idx")),
        migrations.AddIndex(model_name="product", index=models.Index(fields=["category", "is_active"], name="product_cat_active_idx")),
        migrations.AddIndex(model_name="product", index=models.Index(fields=["is_featured", "is_active"], name="product_featured_active_idx")),
        migrations.AddIndex(model_name="product", index=models.Index(fields=["price"], name="product_price_idx")),
        migrations.AddIndex(model_name="product", index=models.Index(fields=["created_at"], name="product_created_idx")),
        migrations.AddIndex(model_name="appointment", index=models.Index(fields=["booking_reference"], name="appt_ref_idx")),
        migrations.AddIndex(model_name="appointment", index=models.Index(fields=["user", "status"], name="appt_user_status_idx")),
        migrations.AddIndex(model_name="appointment", index=models.Index(fields=["stylist", "scheduled_at"], name="appt_stylist_time_idx")),
        migrations.AddIndex(model_name="appointment", index=models.Index(fields=["status", "payment_status"], name="appt_status_pay_idx")),
        migrations.AddIndex(model_name="appointment", index=models.Index(fields=["scheduled_at"], name="appt_time_idx")),
        migrations.AddIndex(
            model_name="review",
            index=models.Index(fields=["target_content_type", "target_object_id"], name="review_target_idx"),
        ),
        migrations.AddIndex(model_name="review", index=models.Index(fields=["user", "created_at"], name="review_user_created_idx")),
        migrations.AddIndex(model_name="review", index=models.Index(fields=["rating"], name="review_rating_idx")),
        migrations.AddConstraint(
            model_name="product",
            constraint=models.CheckConstraint(check=models.Q(("price__gte", 0)), name="product_price_nonnegative"),
        ),
        migrations.AddConstraint(
            model_name="product",
            constraint=models.CheckConstraint(check=models.Q(("stock_quantity__gte", 0)), name="product_stock_nonnegative"),
        ),
        migrations.AddConstraint(
            model_name="appointment",
            constraint=models.CheckConstraint(check=models.Q(("total_amount__gte", 0)), name="appt_amount_nonnegative"),
        ),
        migrations.AddConstraint(
            model_name="appointment",
            constraint=models.CheckConstraint(check=models.Q(("duration_minutes__gte", 15)), name="appt_min_duration"),
        ),
        migrations.AddConstraint(
            model_name="review",
            constraint=models.CheckConstraint(
                check=models.Q(("rating__gte", 1), ("rating__lte", 5)) | models.Q(("rating__isnull", True)),
                name="review_rating_range",
            ),
        ),
    ]
