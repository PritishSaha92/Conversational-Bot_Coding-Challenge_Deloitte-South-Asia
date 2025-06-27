from django.db import migrations

class Migration(migrations.Migration):
    dependencies = [
        ('employee', '0007_chatsummary'),
    ]

    operations = [
        migrations.RunSQL(
            sql='DROP TABLE IF EXISTS alert_message;',
            reverse_sql='',  # No reverse migration needed since we're removing the table
        ),
    ] 