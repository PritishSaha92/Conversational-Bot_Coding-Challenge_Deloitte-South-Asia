"""
Django management command to update average work hours for users based on master_df.csv

This command reads the master_df.csv file and updates the avg_work_hours field 
in the CustomUser model for each employee with matching company_id.
"""

import os
import csv
from django.core.management.base import BaseCommand
from accounts.models import CustomUser

class Command(BaseCommand):
    help = 'Update average work hours for users from master_df.csv'

    def add_arguments(self, parser):
        parser.add_argument('--csv', type=str, help='Path to master_df.csv file')

    def handle(self, *args, **options):
        # Define the path to the master_df.csv file
        if options['csv']:
            csv_path = options['csv']
        else:
            csv_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))), 'master_df.csv')
        
        if not os.path.exists(csv_path):
            self.stdout.write(self.style.ERROR(f"Error: {csv_path} not found"))
            return
        
        self.stdout.write(self.style.SUCCESS(f"Reading data from {csv_path}"))
        
        # Count the total number of records processed and updated
        total_records = 0
        updated_records = 0
        
        # Read the CSV file
        with open(csv_path, 'r') as csv_file:
            reader = csv.DictReader(csv_file)
            
            # Iterate over each row in the CSV file
            for row in reader:
                # Get the employee ID and work hours mean
                employee_id = row['Employee_ID']
                
                # Skip if Work_Hours_mean is empty or 0
                try:
                    work_hours_mean = float(row['Work_Hours_mean'])
                    if work_hours_mean == 0:
                        continue
                except (ValueError, KeyError):
                    continue
                
                total_records += 1
                
                # Try to find the corresponding user
                try:
                    user = CustomUser.objects.get(company_id=employee_id)
                    
                    # Update the average work hours
                    user.avg_work_hours = work_hours_mean
                    user.save()
                    
                    updated_records += 1
                    self.stdout.write(self.style.SUCCESS(f"Updated user {user.username} (Company ID: {employee_id}) with average work hours: {work_hours_mean}"))
                    
                except CustomUser.DoesNotExist:
                    self.stdout.write(self.style.WARNING(f"No user found with company ID: {employee_id}"))
        
        self.stdout.write(self.style.SUCCESS(f"\nSummary: Processed {total_records} records, updated {updated_records} users.")) 