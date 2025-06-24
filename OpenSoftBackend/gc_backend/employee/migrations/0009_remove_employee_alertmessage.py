from django.db import migrations

class Migration(migrations.Migration):
    dependencies = [
        ('employee', '0008_remove_alert_message'),
    ]

    operations = [
        migrations.RunSQL(
            sql='DROP TABLE IF EXISTS employee_alertmessage;',
            reverse_sql='',  # No reverse migration needed since we're removing the table
        ),
    ] 