from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('employee', '0004_rename_timestamp_chathistory_created_at'),
    ]

    operations = [
        migrations.RunSQL(
            # Forward SQL - update the schema
            sql="""
            -- Create a new table without the chat_id field
            CREATE TABLE IF NOT EXISTS employee_chatmessage_new (
                id SERIAL PRIMARY KEY,
                message TEXT NOT NULL,
                direction VARCHAR(10) NOT NULL,
                timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
                user_id INTEGER REFERENCES accounts_customuser(id) ON DELETE CASCADE
            );
            
            -- Copy data from old table to new table
            INSERT INTO employee_chatmessage_new (id, message, direction, timestamp, user_id)
            SELECT id, message, direction, timestamp, user_id FROM employee_chatmessage;
            
            -- Drop old table
            DROP TABLE employee_chatmessage;
            
            -- Rename new table to old name
            ALTER TABLE employee_chatmessage_new RENAME TO employee_chatmessage;
            
            -- Drop the chat history table
            DROP TABLE IF EXISTS employee_chathistory;
            """,
            
            # Reverse SQL - rollback changes
            reverse_sql="""
            -- Cannot restore the schema
            """
        )
    ] 