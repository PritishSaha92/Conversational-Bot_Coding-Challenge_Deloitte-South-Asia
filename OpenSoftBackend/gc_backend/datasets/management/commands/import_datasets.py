import csv
import os
import datetime
from django.core.management.base import BaseCommand
from django.conf import settings
from datasets.models import VibeMeterData, ActivityTrackerData, RewardsData
from accounts.models import CustomUser

class Command(BaseCommand):
    help = 'Import data from CSV files into PostgreSQL database for employees in accounts_customuser'

    def parse_date(self, date_str):
        """Parse date strings from the CSV files into Django-compatible date objects"""
        # Format: DD-MM-YYYY (vibemeter_dataset)
        if '-' in date_str and len(date_str.split('-')[0]) <= 2:
            day, month, year = date_str.split('-')
            return datetime.date(int(year), int(month), int(day))
        # Format: M/D/YYYY (activity_tracker_dataset)
        elif '/' in date_str:
            month, day, year = date_str.split('/')
            return datetime.date(int(year), int(month), int(day))
        # Format: YYYY-MM-DD (rewards_dataset)
        else:
            return datetime.datetime.strptime(date_str, '%Y-%m-%d').date()

    def import_vibemeter_data(self):
        """Import data from vibemeter_dataset.csv"""
        self.stdout.write(self.style.SUCCESS("Importing VibeMeter data..."))
        
        # Get existing employee IDs
        valid_employee_ids = set(CustomUser.objects.values_list('company_id', flat=True))
        self.stdout.write(f"Found {len(valid_employee_ids)} valid employee IDs")
        
        # Clear existing data (optional)
        VibeMeterData.objects.all().delete()
        
        # Import data for employees that exist in accounts_customuser
        filepath = os.path.join(settings.BASE_DIR, 'gc_backend', 'vibemeter_dataset.csv')
        
        if not os.path.exists(filepath):
            self.stdout.write(self.style.ERROR(f"File not found: {filepath}"))
            return
            
        with open(filepath, 'r') as csv_file:
            reader = csv.DictReader(csv_file)
            batch = []
            for row in reader:
                employee_id = row['Employee_ID']
                if employee_id in valid_employee_ids:
                    batch.append(VibeMeterData(
                        employee_id=employee_id,
                        response_date=self.parse_date(row['Response_Date']),
                        vibe_score=int(row['Vibe_Score'])
                    ))
            
            if batch:
                VibeMeterData.objects.bulk_create(batch)
                self.stdout.write(self.style.SUCCESS(f"Imported {len(batch)} VibeMeter records"))
            else:
                self.stdout.write(self.style.WARNING("No valid VibeMeter records found"))

    def import_activity_tracker_data(self):
        """Import data from activity_tracker_dataset.csv"""
        self.stdout.write(self.style.SUCCESS("Importing Activity Tracker data..."))
        
        # Get existing employee IDs
        valid_employee_ids = set(CustomUser.objects.values_list('company_id', flat=True))
        
        # Clear existing data (optional)
        ActivityTrackerData.objects.all().delete()
        
        # Import data
        filepath = os.path.join(settings.BASE_DIR, 'gc_backend', 'activity_tracker_dataset.csv')
        
        if not os.path.exists(filepath):
            self.stdout.write(self.style.ERROR(f"File not found: {filepath}"))
            return
            
        with open(filepath, 'r') as csv_file:
            reader = csv.DictReader(csv_file)
            batch = []
            for row in reader:
                employee_id = row['Employee_ID']
                if employee_id in valid_employee_ids:
                    batch.append(ActivityTrackerData(
                        employee_id=employee_id,
                        date=self.parse_date(row['Date']),
                        teams_messages_sent=int(row['Teams_Messages_Sent']),
                        emails_sent=int(row['Emails_Sent']),
                        meetings_attended=int(row['Meetings_Attended']),
                        work_hours=float(row['Work_Hours'])
                    ))
            
            if batch:
                ActivityTrackerData.objects.bulk_create(batch)
                self.stdout.write(self.style.SUCCESS(f"Imported {len(batch)} Activity Tracker records"))
            else:
                self.stdout.write(self.style.WARNING("No valid Activity Tracker records found"))

    def import_rewards_data(self):
        """Import data from rewards_dataset.csv"""
        self.stdout.write(self.style.SUCCESS("Importing Rewards data..."))
        
        # Get existing employee IDs
        valid_employee_ids = set(CustomUser.objects.values_list('company_id', flat=True))
        
        # Clear existing data (optional)
        RewardsData.objects.all().delete()
        
        # Import data
        filepath = os.path.join(settings.BASE_DIR, 'gc_backend', 'rewards_dataset.csv')
        
        if not os.path.exists(filepath):
            self.stdout.write(self.style.ERROR(f"File not found: {filepath}"))
            return
            
        with open(filepath, 'r') as csv_file:
            reader = csv.DictReader(csv_file)
            batch = []
            for row in reader:
                employee_id = row['Employee_ID']
                if employee_id in valid_employee_ids:
                    batch.append(RewardsData(
                        employee_id=employee_id,
                        award_type=row['Award_Type'],
                        award_date=self.parse_date(row['Award_Date']),
                        reward_points=int(row['Reward_Points'])
                    ))
            
            if batch:
                RewardsData.objects.bulk_create(batch)
                self.stdout.write(self.style.SUCCESS(f"Imported {len(batch)} Rewards records"))
            else:
                self.stdout.write(self.style.WARNING("No valid Rewards records found"))

    def handle(self, *args, **options):
        # First, try to run migrations to ensure tables exist
        self.stdout.write(self.style.SUCCESS("Importing datasets..."))
        
        # Import all datasets
        self.import_vibemeter_data()
        self.import_activity_tracker_data()
        self.import_rewards_data()
        
        self.stdout.write(self.style.SUCCESS("Data import complete!")) 