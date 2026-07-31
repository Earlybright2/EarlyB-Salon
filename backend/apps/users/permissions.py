from rest_framework.permissions import BasePermission

ADMIN_ROLES = {
    "admin",
    "super_admin",
    "verification_admin",
    "finance_admin",
    "support_admin",
    "content_admin",
}


class IsAdminRole(BasePermission):
    message = "Insufficient permissions"

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role in ADMIN_ROLES)


class IsRole(BasePermission):
    role = None

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and (
                request.user.role == self.role
                or request.user.role == "super_admin"
            )
        )


class IsSuperAdmin(IsRole):
    role = "super_admin"


class IsVerificationAdmin(IsRole):
    role = "verification_admin"


class IsFinanceAdmin(IsRole):
    role = "finance_admin"


class IsSupportAdmin(IsRole):
    role = "support_admin"


class IsContentAdmin(IsRole):
    role = "content_admin"
