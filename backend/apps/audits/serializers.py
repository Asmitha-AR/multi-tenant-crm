from rest_framework import serializers

from apps.audits.models import ActivityLog


class ActivityLogSerializer(serializers.ModelSerializer):
    performed_by = serializers.CharField(source="user.username", read_only=True)

    class Meta:
        model = ActivityLog
        fields = [
            "id",
            "performed_by",
            "action",
            "model_name",
            "object_id",
            "created_at",
        ]

