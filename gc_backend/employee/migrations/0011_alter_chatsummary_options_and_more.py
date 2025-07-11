# Generated by Django 5.1.7 on 2025-04-07 20:47

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("employee", "0010_merge_20250407_2009"),
    ]

    operations = [
        migrations.AlterModelOptions(
            name="chatsummary",
            options={"verbose_name_plural": "Chat Summaries"},
        ),
        migrations.RenameField(
            model_name="chatsummary",
            old_name="employee",
            new_name="user_id",
        ),
        migrations.RemoveField(
            model_name="chatsummary",
            name="is_flagged",
        ),
        migrations.RemoveField(
            model_name="chatsummary",
            name="summary",
        ),
        migrations.AddField(
            model_name="chatsummary",
            name="summary_data",
            field=models.JSONField(default=dict),
        ),
        migrations.DeleteModel(
            name="FlaggedEmployeeSummary",
        ),
    ]
