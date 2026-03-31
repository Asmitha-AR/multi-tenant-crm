from rest_framework import serializers

from apps.accounts.models import Organization
from apps.crm.models import Company, Contact


class CompanySerializer(serializers.ModelSerializer):
    logo = serializers.ImageField(write_only=True, required=False, allow_null=True)
    logo_url = serializers.SerializerMethodField()
    contact_count = serializers.IntegerField(read_only=True)
    remove_logo = serializers.BooleanField(write_only=True, required=False, default=False)

    class Meta:
        model = Company
        fields = [
            "id",
            "name",
            "industry",
            "country",
            "logo",
            "logo_url",
            "contact_count",
            "remove_logo",
            "organization",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["organization", "created_at", "updated_at"]

    def get_logo_url(self, obj):
        if not obj.logo:
            return None
        request = self.context.get("request")
        try:
            logo_url = obj.logo.url
        except Exception:
            return None
        return request.build_absolute_uri(logo_url) if request else logo_url

    def validate_logo(self, value):
        request = self.context.get("request")
        if not value or not request or not request.user.is_authenticated:
            return value
        if request.user.organization.subscription_plan != Organization.SubscriptionPlan.PRO:
            raise serializers.ValidationError("Logo upload is available only on the Pro plan.")
        if value.size > 5 * 1024 * 1024:
            raise serializers.ValidationError("Logo size must be 5 MB or smaller.")
        return value

    def update(self, instance, validated_data):
        remove_logo = validated_data.pop("remove_logo", False)
        if remove_logo:
            instance.logo.delete(save=False)
            instance.logo = None
        return super().update(instance, validated_data)


class ContactSerializer(serializers.ModelSerializer):
    class Meta:
        model = Contact
        fields = [
            "id",
            "company",
            "full_name",
            "email",
            "phone",
            "role",
            "organization",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["organization", "created_at", "updated_at"]

    def validate(self, attrs):
        company = attrs.get("company") or getattr(self.instance, "company", None)
        request = self.context.get("request")
        if company and request and company.organization_id != request.user.organization_id:
            raise serializers.ValidationError("Company must belong to your organization.")
        return attrs

    def validate_email(self, value):
        company = self.initial_data.get("company") or getattr(self.instance, "company_id", None)
        queryset = Contact.objects.filter(company_id=company, email__iexact=value, is_deleted=False)
        if self.instance:
            queryset = queryset.exclude(pk=self.instance.pk)
        if queryset.exists():
            raise serializers.ValidationError("Email must be unique within the same company.")
        return value
