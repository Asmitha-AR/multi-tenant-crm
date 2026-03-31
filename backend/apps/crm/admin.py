from django.contrib import admin

from apps.crm.models import Company, Contact


@admin.register(Company)
class CompanyAdmin(admin.ModelAdmin):
    list_display = ("name", "industry", "country", "organization", "is_deleted", "created_at")
    list_filter = ("industry", "country", "organization", "is_deleted")
    search_fields = ("name", "industry", "country")


@admin.register(Contact)
class ContactAdmin(admin.ModelAdmin):
    list_display = ("full_name", "email", "company", "organization", "role", "is_deleted", "created_at")
    list_filter = ("organization", "role", "is_deleted")
    search_fields = ("full_name", "email", "role")

