from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin

from apps.accounts.models import Organization, User


@admin.register(Organization)
class OrganizationAdmin(admin.ModelAdmin):
    list_display = ("name", "subscription_plan", "created_at")
    search_fields = ("name",)


@admin.register(User)
class UserAdmin(DjangoUserAdmin):
    list_display = ("username", "email", "organization", "role", "is_staff")
    list_filter = ("role", "organization", "is_staff", "is_superuser")
    fieldsets = DjangoUserAdmin.fieldsets + (
        ("Organization Access", {"fields": ("organization", "role")}),
    )

