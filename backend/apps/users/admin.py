from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from apps.users.models import User


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    ordering = ["-created_at"]
    list_display = ["email", "union_id", "name", "role", "is_active", "is_suspended", "created_at"]
    search_fields = ["email", "union_id", "name"]
    list_filter = ["role", "is_active", "is_suspended", "auth_provider"]

    fieldsets = (
        (None, {"fields": ("union_id", "email", "password")}),
        ("Personal info", {"fields": ("name", "avatar", "phone_number", "gender", "date_of_birth")}),
        ("Hair profile", {"fields": ("hair_type", "face_shape", "hairline_stage", "skin_tone")}),
        ("Permissions", {"fields": ("role", "is_active", "is_suspended", "is_verified", "is_staff", "is_superuser", "groups", "user_permissions")}),
        ("Important dates", {"fields": ("last_login", "last_login_at", "date_joined")}),
    )
    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": ("union_id", "email", "password1", "password2"),
            },
        ),
    )
    readonly_fields = ["created_at", "updated_at"]
