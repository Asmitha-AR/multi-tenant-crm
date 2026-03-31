import shutil
import tempfile
from datetime import timedelta
from io import BytesIO

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings
from django.utils import timezone
from PIL import Image
from rest_framework.test import APITestCase

from apps.accounts.models import Organization, User
from apps.audits.models import ActivityLog
from apps.core.tenant import tenant_context
from apps.crm.models import Company, Contact


TEST_MEDIA_ROOT = tempfile.mkdtemp()


@override_settings(MEDIA_ROOT=TEST_MEDIA_ROOT)
class CRMApiTests(APITestCase):
    @classmethod
    def tearDownClass(cls):
        shutil.rmtree(TEST_MEDIA_ROOT, ignore_errors=True)
        super().tearDownClass()

    def setUp(self):
        self.alpha = Organization.objects.create(name="Alpha Test", subscription_plan="PRO")
        self.beta = Organization.objects.create(name="Beta Test", subscription_plan="BASIC")

        self.alpha_admin = User.objects.create_user(
            username="alpha_admin_test",
            password="alpha12345",
            organization=self.alpha,
            role=User.Role.ADMIN,
        )
        self.alpha_manager = User.objects.create_user(
            username="alpha_manager_test",
            password="alpha12345",
            organization=self.alpha,
            role=User.Role.MANAGER,
        )
        self.alpha_staff = User.objects.create_user(
            username="alpha_staff_test",
            password="alpha12345",
            organization=self.alpha,
            role=User.Role.STAFF,
        )
        self.beta_admin = User.objects.create_user(
            username="beta_admin_test",
            password="beta12345",
            organization=self.beta,
            role=User.Role.ADMIN,
        )

        self.alpha_company = Company.objects.create(
            organization=self.alpha,
            name="Alpha Logistics",
            industry="Logistics",
            country="Sri Lanka",
        )
        Company.objects.create(
            organization=self.beta,
            name="Beta Foods",
            industry="Food",
            country="India",
        )
        Contact.objects.create(
            organization=self.alpha,
            company=self.alpha_company,
            full_name="Alpha Contact",
            email="alpha@example.com",
            phone="94771234567",
            role="Ops Lead",
        )

    def authenticate(self, username, password):
        response = self.client.post(
            "/api/v1/auth/login/",
            {"username": username, "password": password},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        token = response.json()["data"]["access"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")

    def test_tenant_isolation_hides_other_organization_records(self):
        self.authenticate("beta_admin_test", "beta12345")

        response = self.client.get("/api/v1/companies/?search=Alpha")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["data"]["count"], 0)

    def test_tenant_isolation_blocks_detail_access_to_other_organization_company(self):
        self.authenticate("beta_admin_test", "beta12345")

        response = self.client.get(f"/api/v1/companies/{self.alpha_company.id}/")

        self.assertEqual(response.status_code, 404)

    def test_tenant_manager_scopes_records_from_current_organization_context(self):
        with tenant_context(self.alpha):
            self.assertEqual(Company.objects.count(), 1)
            self.assertEqual(Company.objects.first().organization_id, self.alpha.id)

        with tenant_context(self.beta):
            self.assertEqual(Company.objects.count(), 1)
            self.assertEqual(Company.objects.first().organization_id, self.beta.id)

        self.assertEqual(Company.all_objects.count(), 2)

    def test_staff_can_create_but_cannot_update_or_delete_company(self):
        self.authenticate("alpha_staff_test", "alpha12345")

        create_response = self.client.post(
            "/api/v1/companies/",
            {"name": "Staff Created", "industry": "IT", "country": "Sri Lanka"},
            format="json",
        )
        self.assertEqual(create_response.status_code, 201)
        company_id = create_response.json()["data"]["id"]

        patch_response = self.client.patch(
            f"/api/v1/companies/{company_id}/",
            {"country": "India"},
            format="json",
        )
        self.assertEqual(patch_response.status_code, 403)

        delete_response = self.client.delete(f"/api/v1/companies/{company_id}/")
        self.assertEqual(delete_response.status_code, 403)

    def test_manager_can_update_but_cannot_delete(self):
        self.authenticate("alpha_manager_test", "alpha12345")

        patch_response = self.client.patch(
            f"/api/v1/companies/{self.alpha_company.id}/",
            {"country": "Singapore"},
            format="json",
        )
        self.assertEqual(patch_response.status_code, 200)

        delete_response = self.client.delete(f"/api/v1/companies/{self.alpha_company.id}/")
        self.assertEqual(delete_response.status_code, 403)

    def test_admin_can_complete_company_crud_flow(self):
        self.authenticate("alpha_admin_test", "alpha12345")

        create_response = self.client.post(
            "/api/v1/companies/",
            {"name": "CRUD Company", "industry": "IT", "country": "Sri Lanka"},
            format="json",
        )
        self.assertEqual(create_response.status_code, 201)
        company_id = create_response.json()["data"]["id"]

        retrieve_response = self.client.get(f"/api/v1/companies/{company_id}/")
        self.assertEqual(retrieve_response.status_code, 200)
        self.assertEqual(retrieve_response.json()["data"]["name"], "CRUD Company")

        update_response = self.client.patch(
            f"/api/v1/companies/{company_id}/",
            {"country": "Singapore"},
            format="json",
        )
        self.assertEqual(update_response.status_code, 200)
        self.assertEqual(update_response.json()["data"]["country"], "Singapore")

        delete_response = self.client.delete(f"/api/v1/companies/{company_id}/")
        self.assertEqual(delete_response.status_code, 200)

    def test_activity_log_created_for_create_update_delete(self):
        self.authenticate("alpha_admin_test", "alpha12345")

        create_response = self.client.post(
            "/api/v1/companies/",
            {"name": "Audit Co", "industry": "Tech", "country": "Sri Lanka"},
            format="json",
        )
        company_id = create_response.json()["data"]["id"]

        self.client.patch(
            f"/api/v1/companies/{company_id}/",
            {"industry": "Fintech"},
            format="json",
        )
        self.client.delete(f"/api/v1/companies/{company_id}/")

        actions = list(
            ActivityLog.objects.filter(
                organization=self.alpha,
                model_name="Company",
                object_id=company_id,
            ).values_list("action", flat=True)
        )
        self.assertEqual(actions, ["DELETE", "UPDATE", "CREATE"])

    def test_soft_deleted_company_is_hidden_from_active_list(self):
        self.authenticate("alpha_admin_test", "alpha12345")

        response = self.client.delete(f"/api/v1/companies/{self.alpha_company.id}/")

        self.assertEqual(response.status_code, 200)
        self.alpha_company.refresh_from_db()
        self.assertTrue(self.alpha_company.is_deleted)
        self.assertIsNotNone(self.alpha_company.deleted_at)
        self.assertFalse(
            Company.all_objects.active().filter(id=self.alpha_company.id).exists()
        )
        self.assertTrue(
            Company.all_objects.filter(id=self.alpha_company.id, is_deleted=True).exists()
        )

    def test_contact_email_must_be_unique_within_company(self):
        self.authenticate("alpha_admin_test", "alpha12345")

        response = self.client.post(
            "/api/v1/contacts/",
            {
                "company": self.alpha_company.id,
                "full_name": "Duplicate Contact",
                "email": "alpha@example.com",
                "phone": "94770000000",
                "role": "Assistant",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 400)

    @override_settings(
        STORAGES={
            "default": {
                "BACKEND": "django.core.files.storage.FileSystemStorage",
                "OPTIONS": {"location": TEST_MEDIA_ROOT},
            },
            "staticfiles": {
                "BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage",
            },
        }
    )
    def test_company_logo_upload_works(self):
        self.authenticate("alpha_admin_test", "alpha12345")
        image_stream = BytesIO()
        Image.new("RGB", (2, 2), color="red").save(image_stream, format="PNG")
        image_stream.seek(0)
        logo = SimpleUploadedFile(
            "logo.png",
            image_stream.read(),
            content_type="image/png",
        )

        response = self.client.post(
            "/api/v1/companies/",
            {
                "name": "Logo Co",
                "industry": "Retail",
                "country": "Sri Lanka",
                "logo": logo,
            },
            format="multipart",
        )

        self.assertEqual(response.status_code, 201)
        self.assertIn("logo_url", response.json()["data"])

    def test_basic_plan_cannot_access_activity_logs(self):
        self.authenticate("beta_admin_test", "beta12345")

        response = self.client.get("/api/v1/activity-logs/")

        self.assertEqual(response.status_code, 403)

    def test_pro_plan_can_access_activity_logs(self):
        self.authenticate("alpha_admin_test", "alpha12345")

        response = self.client.get("/api/v1/activity-logs/")

        self.assertEqual(response.status_code, 200)
        self.assertIn("results", response.json()["data"])

    def test_activity_logs_support_action_model_user_and_date_filters(self):
        older_log = ActivityLog.objects.create(
            user=self.alpha_admin,
            organization=self.alpha,
            action="CREATE",
            model_name="Company",
            object_id=101,
        )
        newer_log = ActivityLog.objects.create(
            user=self.alpha_manager,
            organization=self.alpha,
            action="UPDATE",
            model_name="Contact",
            object_id=202,
        )
        ActivityLog.objects.filter(id=older_log.id).update(created_at=timezone.now() - timedelta(days=3))
        ActivityLog.objects.filter(id=newer_log.id).update(created_at=timezone.now())

        self.authenticate("alpha_admin_test", "alpha12345")

        action_response = self.client.get("/api/v1/activity-logs/?action=UPDATE")
        self.assertEqual(action_response.status_code, 200)
        self.assertTrue(
            all(item["action"] == "UPDATE" for item in action_response.json()["data"]["results"])
        )

        model_response = self.client.get("/api/v1/activity-logs/?model=Contact")
        self.assertEqual(model_response.status_code, 200)
        self.assertTrue(
            all(item["model_name"] == "Contact" for item in model_response.json()["data"]["results"])
        )

        user_response = self.client.get("/api/v1/activity-logs/?user=alpha_manager")
        self.assertEqual(user_response.status_code, 200)
        self.assertTrue(
            all("alpha_manager" in item["performed_by"] for item in user_response.json()["data"]["results"])
        )

        today = timezone.now().date().isoformat()
        date_response = self.client.get(f"/api/v1/activity-logs/?date_from={today}&date_to={today}")
        self.assertEqual(date_response.status_code, 200)
        self.assertTrue(
            all(item["id"] != older_log.id for item in date_response.json()["data"]["results"])
        )

    def test_basic_plan_cannot_upload_company_logo(self):
        self.authenticate("beta_admin_test", "beta12345")
        image_stream = BytesIO()
        Image.new("RGB", (2, 2), color="blue").save(image_stream, format="PNG")
        image_stream.seek(0)
        logo = SimpleUploadedFile(
            "basic-logo.png",
            image_stream.read(),
            content_type="image/png",
        )

        response = self.client.post(
            "/api/v1/companies/",
            {
                "name": "Basic Logo Co",
                "industry": "Retail",
                "country": "India",
                "logo": logo,
            },
            format="multipart",
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("Logo upload is available only on the Pro plan.", str(response.json()))

    @override_settings(
        STORAGES={
            "default": {
                "BACKEND": "django.core.files.storage.FileSystemStorage",
                "OPTIONS": {"location": TEST_MEDIA_ROOT},
            },
            "staticfiles": {
                "BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage",
            },
        }
    )
    def test_basic_plan_cannot_update_existing_company_with_logo(self):
        basic_company = Company.objects.create(
            organization=self.beta,
            name="Basic Existing",
            industry="Retail",
            country="India",
        )
        self.authenticate("beta_admin_test", "beta12345")

        image_stream = BytesIO()
        Image.new("RGB", (2, 2), color="green").save(image_stream, format="PNG")
        image_stream.seek(0)
        logo = SimpleUploadedFile(
            "basic-update-logo.png",
            image_stream.read(),
            content_type="image/png",
        )

        response = self.client.patch(
            f"/api/v1/companies/{basic_company.id}/",
            {"logo": logo},
            format="multipart",
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("Logo upload is available only on the Pro plan.", str(response.json()))
