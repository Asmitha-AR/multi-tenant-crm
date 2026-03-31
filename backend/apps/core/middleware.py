from rest_framework_simplejwt.authentication import JWTAuthentication

from apps.core.tenant import clear_current_organization, set_current_organization


class CurrentOrganizationMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        organization = None
        user = getattr(request, "user", None)
        if user and user.is_authenticated:
            organization = getattr(user, "organization", None)
        else:
            try:
                auth_result = JWTAuthentication().authenticate(request)
            except Exception:
                auth_result = None
            if auth_result:
                user, _ = auth_result
                request.user = user
                organization = getattr(user, "organization", None)

        set_current_organization(organization)
        request.organization = organization
        try:
            return self.get_response(request)
        finally:
            clear_current_organization()
