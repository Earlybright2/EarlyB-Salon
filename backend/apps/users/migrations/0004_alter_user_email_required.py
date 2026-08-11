from django.db import migrations, models


def fill_null_emails(apps, schema_editor):
    """Ensure no NULL emails before applying NOT NULL constraint."""
    User = apps.get_model("users", "User")
    for user in User.objects.filter(email__isnull=True):
        # Synthetic unique placeholder derived from union_id / pk
        base = (user.union_id or f"user-{user.pk}").replace(":", "-").replace(" ", "")
        candidate = f"{base}@placeholder.earlybright.local"
        # Avoid unique collisions
        suffix = 0
        while User.objects.filter(email=candidate).exists():
            suffix += 1
            candidate = f"{base}-{suffix}@placeholder.earlybright.local"
        user.email = candidate
        user.save(update_fields=["email"])


def noop_reverse(apps, schema_editor):
    pass


class Migration(migrations.Migration):
    dependencies = [
        ("users", "0003_prefix_union_ids"),
    ]

    operations = [
        migrations.RunPython(fill_null_emails, noop_reverse),
        migrations.AlterField(
            model_name="user",
            name="email",
            field=models.EmailField(max_length=320, unique=True),
        ),
    ]
