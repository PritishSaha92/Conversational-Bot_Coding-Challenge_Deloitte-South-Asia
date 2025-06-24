from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("datasets", "0002_tablesemployee"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="tablesemployee",
            name="rewards_average",
        ),
        migrations.RemoveField(
            model_name="tablesemployee",
            name="performance_average",
        ),
    ] 