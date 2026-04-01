from rest_framework import permissions
from rest_framework.views import APIView

from apps.audits.models import ActivityLog
from apps.audits.serializers import ActivityLogSerializer
from apps.core.api import api_success, paginated_payload
from apps.core.pagination import StandardResultsSetPagination
from apps.core.permissions import IsProPlan


class ActivityLogListView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsProPlan]
    pagination_class = StandardResultsSetPagination

    def get(self, request):
        queryset = ActivityLog.objects.select_related("user")
        action = request.query_params.get("action")
        model_name = request.query_params.get("model")
        performed_by = request.query_params.get("user")
        date_from = request.query_params.get("date_from")
        date_to = request.query_params.get("date_to")

        if action:
            queryset = queryset.filter(action__iexact=action)
        if model_name:
            queryset = queryset.filter(model_name__iexact=model_name)
        if performed_by:
            queryset = queryset.filter(user__username__icontains=performed_by)
        if date_from:
            queryset = queryset.filter(created_at__date__gte=date_from)
        if date_to:
            queryset = queryset.filter(created_at__date__lte=date_to)

        paginator = self.pagination_class()
        page = paginator.paginate_queryset(queryset, request)
        serializer = ActivityLogSerializer(page, many=True)
        return api_success(paginated_payload(paginator.page, serializer), message="Activity logs fetched")
