from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("crm", "0003_service"),
    ]

    operations = [
        migrations.AddField(
            model_name="service",
            name="status",
            field=models.CharField(
                choices=[("ACTIVE", "Active"), ("PLANNED", "Planned"), ("PAUSED", "Paused")],
                default="ACTIVE",
                max_length=20,
            ),
        ),
    ]
