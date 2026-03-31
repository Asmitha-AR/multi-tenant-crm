from rest_framework import permissions
from rest_framework.views import APIView

from apps.audits.models import ActivityLog
from apps.audits.serializers import ActivityLogSerializer
from apps.core.api import api_success, paginated_payload
from apps.core.pagination import StandardResultsSetPagination


class ActivityLogListView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = StandardResultsSetPagination

    def get(self, request):
        queryset = ActivityLog.objects.filter(organization=request.user.organization).select_related("user")
        paginator = self.pagination_class()
        page = paginator.paginate_queryset(queryset, request)
        serializer = ActivityLogSerializer(page, many=True)
        return api_success(paginated_payload(page, serializer), message="Activity logs fetched")

