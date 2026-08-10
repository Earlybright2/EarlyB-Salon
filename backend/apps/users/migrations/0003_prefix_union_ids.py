from django.db import migrations


def prefix_union_ids(apps, schema_editor):
    User = apps.get_model("users", "User")
    for user in User.objects.all():
        uid = user.union_id or ""
        provider = (user.auth_provider or "email").lower()
        if provider == "email" and not uid.startswith("email:"):
            user.union_id = f"email:{uid}"
            user.save(update_fields=["union_id"])
        elif provider == "google" and not uid.startswith("google:"):
            user.union_id = f"google:{uid}"
            user.save(update_fields=["union_id"])
        elif provider == "apple" and not uid.startswith("apple:"):
            user.union_id = f"apple:{uid}"
            user.save(update_fields=["union_id"])


def unprefix_union_ids(apps, schema_editor):
    User = apps.get_model("users", "User")
    for user in User.objects.all():
        uid = user.union_id or ""
        for prefix in ("email:", "google:", "apple:"):
            if uid.startswith(prefix):
                user.union_id = uid[len(prefix):]
                user.save(update_fields=["union_id"])
                break


class Migration(migrations.Migration):
    dependencies = [
        ("users", "0002_alter_user_role"),
    ]

    operations = [
        migrations.RunPython(prefix_union_ids, unprefix_union_ids),
    ]
