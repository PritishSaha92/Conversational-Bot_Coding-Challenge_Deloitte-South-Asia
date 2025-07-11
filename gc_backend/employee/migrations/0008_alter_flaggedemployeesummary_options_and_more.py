# Generated by Django 5.1.7 on 2025-04-05 18:31

from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("employee", "0007_chatsummary_flaggedemployeesummary"),
    ]

    operations = [
        migrations.AlterModelOptions(
            name="flaggedemployeesummary",
            options={
                "verbose_name": "Flagged Employee Summary",
                "verbose_name_plural": "Flagged Employee Summaries",
            },
        ),
        migrations.RemoveField(
            model_name="flaggedemployeesummary",
            name="created_at",
        ),
        migrations.RemoveField(
            model_name="flaggedemployeesummary",
            name="flag_date",
        ),
        migrations.RemoveField(
            model_name="flaggedemployeesummary",
            name="flag_reason",
        ),
        migrations.RemoveField(
            model_name="flaggedemployeesummary",
            name="is_active",
        ),
        migrations.RemoveField(
            model_name="flaggedemployeesummary",
            name="updated_at",
        ),
    ]
