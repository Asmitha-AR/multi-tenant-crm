from django.core.management.base import BaseCommand

from apps.accounts.models import Organization, User
from apps.crm.models import Company, Contact


class Command(BaseCommand):
    help = "Seed demo organizations, users, companies, and contacts for the assessment."

    def handle(self, *args, **options):
        alpha, _ = Organization.objects.get_or_create(
            name="Alpha Corp",
            defaults={"subscription_plan": Organization.SubscriptionPlan.PRO},
        )
        beta, _ = Organization.objects.get_or_create(
            name="Beta Ventures",
            defaults={"subscription_plan": Organization.SubscriptionPlan.BASIC},
        )

        self.create_user("alpha_admin", "alpha12345", alpha, User.Role.ADMIN)
        self.create_user("alpha_manager", "alpha12345", alpha, User.Role.MANAGER)
        self.create_user("alpha_staff", "alpha12345", alpha, User.Role.STAFF)
        self.create_user("beta_admin", "beta12345", beta, User.Role.ADMIN)

        acme, _ = Company.objects.get_or_create(
            organization=alpha,
            name="Acme Logistics",
            defaults={"industry": "Logistics", "country": "Sri Lanka"},
        )
        nova, _ = Company.objects.get_or_create(
            organization=alpha,
            name="Nova Health",
            defaults={"industry": "Healthcare", "country": "Singapore"},
        )
        Company.objects.get_or_create(
            organization=beta,
            name="Beta Foods",
            defaults={"industry": "Food", "country": "India"},
        )

        Contact.objects.get_or_create(
            organization=alpha,
            company=acme,
            email="operations@acme.test",
            defaults={
                "full_name": "Kamal Perera",
                "phone": "94771234567",
                "role": "Operations Lead",
            },
        )
        Contact.objects.get_or_create(
            organization=alpha,
            company=nova,
            email="hello@nova.test",
            defaults={
                "full_name": "Sara Lim",
                "phone": "6581234567",
                "role": "Partnership Manager",
            },
        )

        self.stdout.write(self.style.SUCCESS("Demo data seeded successfully."))

    def create_user(self, username, password, organization, role):
        user, created = User.objects.get_or_create(
            username=username,
            defaults={
                "organization": organization,
                "role": role,
                "email": f"{username}@example.com",
            },
        )
        if created:
            user.set_password(password)
            user.save(update_fields=["password"])
