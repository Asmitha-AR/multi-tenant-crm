from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("crm", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="company",
            name="services",
            field=models.JSONField(blank=True, default=list),
        ),
    ]
