from rest_framework.permissions import BasePermission


class IsOrganizationMember(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.organization_id)


class RolePermission(BasePermission):
    allowed_roles = set()

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role in self.allowed_roles
        )


class CanDeleteRecords(BasePermission):
    def has_permission(self, request, view):
        if request.method != "DELETE":
            return True
        return bool(request.user and request.user.is_authenticated and request.user.role == "ADMIN")


class CanEditRecords(BasePermission):
    def has_permission(self, request, view):
        if request.method in ("GET", "HEAD", "OPTIONS"):
            return True
        if request.method == "POST":
            return bool(
                request.user
                and request.user.is_authenticated
                and request.user.role in {"ADMIN", "MANAGER", "STAFF"}
            )
        if request.method in ("PUT", "PATCH"):
            return bool(
                request.user
                and request.user.is_authenticated
                and request.user.role in {"ADMIN", "MANAGER"}
            )
        return True


class IsProPlan(BasePermission):
    message = "This feature is available only on the Pro plan."

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.organization
            and request.user.organization.subscription_plan == "PRO"
        )
