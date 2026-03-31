from django.contrib import admin

from apps.audits.models import ActivityLog


@admin.register(ActivityLog)
class ActivityLogAdmin(admin.ModelAdmin):
    list_display = ("user", "organization", "action", "model_name", "object_id", "created_at")
    list_filter = ("organization", "action", "model_name")
    search_fields = ("user__username", "model_name")

