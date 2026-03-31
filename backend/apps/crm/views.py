from django.db.models import Count, Q
from rest_framework import permissions, status, viewsets

from apps.core.api import api_success, paginated_payload
from apps.core.models import ActivityAction
from apps.core.pagination import StandardResultsSetPagination
from apps.core.permissions import CanDeleteRecords, CanEditRecords, IsOrganizationMember
from apps.crm.models import Company, Contact
from apps.crm.serializers import CompanySerializer, ContactSerializer
from apps.crm.services import log_crm_activity


class TenantScopedModelViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated, IsOrganizationMember, CanEditRecords, CanDeleteRecords]
    pagination_class = StandardResultsSetPagination
    model = None

    def get_queryset(self):
        queryset = self.base_queryset()
        search = self.request.query_params.get("search")
        if search:
            queryset = self.apply_search(queryset, search)
        queryset = self.apply_filters(queryset)
        return queryset

    def base_queryset(self):
        return self.model.objects.active()

    def apply_search(self, queryset, search):
        return queryset

    def apply_filters(self, queryset):
        return queryset

    def perform_create(self, serializer):
        instance = serializer.save(organization=self.request.user.organization)
        log_crm_activity(user=self.request.user, action=ActivityAction.CREATE, instance=instance)

    def perform_update(self, serializer):
        instance = serializer.save()
        log_crm_activity(user=self.request.user, action=ActivityAction.UPDATE, instance=instance)

    def perform_destroy(self, instance):
        instance.soft_delete()
        log_crm_activity(user=self.request.user, action=ActivityAction.DELETE, instance=instance)

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return api_success(paginated_payload(self.paginator.page, serializer), message="List fetched")
        serializer = self.get_serializer(queryset, many=True)
        return api_success(serializer.data, message="List fetched")

    def retrieve(self, request, *args, **kwargs):
        serializer = self.get_serializer(self.get_object())
        return api_success(serializer.data, message="Record fetched")

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return api_success(serializer.data, message="Record created", status_code=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return api_success(serializer.data, message="Record updated")

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        return api_success(message="Record deleted", status_code=status.HTTP_200_OK)


class CompanyViewSet(TenantScopedModelViewSet):
    model = Company
    serializer_class = CompanySerializer

    def base_queryset(self):
        return (
            Company.objects.select_related("organization")
            .annotate(contact_count=Count("contacts", filter=Q(contacts__is_deleted=False)))
            .active()
        )

    def apply_search(self, queryset, search):
        return queryset.filter(
            Q(name__icontains=search)
            | Q(industry__icontains=search)
            | Q(country__icontains=search)
        )

    def apply_filters(self, queryset):
        industry = (self.request.query_params.get("industry") or "").strip()
        country = (self.request.query_params.get("country") or "").strip()
        if industry:
            queryset = queryset.filter(industry__icontains=industry)
        if country:
            queryset = queryset.filter(country__icontains=country)
        return queryset


class ContactViewSet(TenantScopedModelViewSet):
    model = Contact
    serializer_class = ContactSerializer

    def base_queryset(self):
        return Contact.objects.select_related("organization", "company").active()

    def get_queryset(self):
        queryset = super().get_queryset()
        company_id = self.request.query_params.get("company")
        if company_id:
            queryset = queryset.filter(company_id=company_id)
        return queryset

    def apply_search(self, queryset, search):
        return queryset.filter(
            Q(full_name__icontains=search)
            | Q(email__icontains=search)
            | Q(role__icontains=search)
        )

    def apply_filters(self, queryset):
        role_name = self.request.query_params.get("role")
        if role_name:
            queryset = queryset.filter(role__iexact=role_name)
        return queryset
