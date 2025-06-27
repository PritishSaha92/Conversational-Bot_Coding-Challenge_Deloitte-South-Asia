from django.core.management.base import BaseCommand
from django.db import connection

class Command(BaseCommand):
    help = 'Remove unused columns (rewards_average and performance_average) from tables_employee table'

    def handle(self, *args, **options):
        self.stdout.write("Checking current table structure...")
        columns = self.display_table_columns()
        
        self.stdout.write("\nRemoving unused columns...")
        self.remove_unused_columns()
        
        self.stdout.write("\nUpdated table structure:")
        self.display_table_columns()
        
        self.stdout.write(self.style.SUCCESS('Successfully removed unused columns'))

    def display_table_columns(self):
        """Display current columns in the tables_employee table"""
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'tables_employee'
            """)
            columns = [row[0] for row in cursor.fetchall()]
            self.stdout.write(f"Current columns in tables_employee: {columns}")
            return columns

    def remove_unused_columns(self):
        """Remove the unused columns from the tables_employee table"""
        with connection.cursor() as cursor:
            # Check if columns exist before trying to drop them
            cursor.execute("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'tables_employee' 
                AND column_name IN ('rewards_average', 'performance_average')
            """)
            columns_to_drop = [row[0] for row in cursor.fetchall()]
            
            if columns_to_drop:
                self.stdout.write(f"Columns to drop: {columns_to_drop}")
                
                # Drop each column individually
                for column in columns_to_drop:
                    self.stdout.write(f"Dropping column: {column}")
                    cursor.execute(f"""
                        ALTER TABLE tables_employee 
                        DROP COLUMN IF EXISTS {column}
                    """)
                
                self.stdout.write("Columns removed successfully")
            else:
                self.stdout.write("No unused columns found to remove") 