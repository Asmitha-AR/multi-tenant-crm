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
        paginator = self.pagination_class()
        page = paginator.paginate_queryset(queryset, request)
        serializer = ActivityLogSerializer(page, many=True)
        return api_success(paginated_payload(paginator.page, serializer), message="Activity logs fetched")
