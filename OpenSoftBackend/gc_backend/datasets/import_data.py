import os
import csv
import django
import datetime

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'gc_backend.settings')
django.setup()

from datasets.models import VibeMeterData, ActivityTrackerData, RewardsData
from accounts.models import CustomUser

def parse_date(date_str):
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

def import_vibemeter_data():
    """Import data from vibemeter_dataset.csv"""
    print("Importing VibeMeter data...")
    
    # Get existing employee IDs
    valid_employee_ids = set(CustomUser.objects.values_list('company_id', flat=True))
    
    # Clear existing data (optional)
    VibeMeterData.objects.all().delete()
    
    # Import data for employees that exist in accounts_customuser
    filepath = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'vibemeter_dataset.csv')
    with open(filepath, 'r') as csv_file:
        reader = csv.DictReader(csv_file)
        batch = []
        for row in reader:
            employee_id = row['Employee_ID']
            if employee_id in valid_employee_ids:
                batch.append(VibeMeterData(
                    employee_id=employee_id,
                    response_date=parse_date(row['Response_Date']),
                    vibe_score=int(row['Vibe_Score'])
                ))
        
        if batch:
            VibeMeterData.objects.bulk_create(batch)
            print(f"Imported {len(batch)} VibeMeter records")
        else:
            print("No valid VibeMeter records found")

def import_activity_tracker_data():
    """Import data from activity_tracker_dataset.csv"""
    print("Importing Activity Tracker data...")
    
    # Get existing employee IDs
    valid_employee_ids = set(CustomUser.objects.values_list('company_id', flat=True))
    
    # Clear existing data (optional)
    ActivityTrackerData.objects.all().delete()
    
    # Import data
    filepath = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'activity_tracker_dataset.csv')
    with open(filepath, 'r') as csv_file:
        reader = csv.DictReader(csv_file)
        batch = []
        for row in reader:
            employee_id = row['Employee_ID']
            if employee_id in valid_employee_ids:
                batch.append(ActivityTrackerData(
                    employee_id=employee_id,
                    date=parse_date(row['Date']),
                    teams_messages_sent=int(row['Teams_Messages_Sent']),
                    emails_sent=int(row['Emails_Sent']),
                    meetings_attended=int(row['Meetings_Attended']),
                    work_hours=float(row['Work_Hours'])
                ))
        
        if batch:
            ActivityTrackerData.objects.bulk_create(batch)
            print(f"Imported {len(batch)} Activity Tracker records")
        else:
            print("No valid Activity Tracker records found")

def import_rewards_data():
    """Import data from rewards_dataset.csv"""
    print("Importing Rewards data...")
    
    # Get existing employee IDs
    valid_employee_ids = set(CustomUser.objects.values_list('company_id', flat=True))
    
    # Clear existing data (optional)
    RewardsData.objects.all().delete()
    
    # Import data
    filepath = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'rewards_dataset.csv')
    with open(filepath, 'r') as csv_file:
        reader = csv.DictReader(csv_file)
        batch = []
        for row in reader:
            employee_id = row['Employee_ID']
            if employee_id in valid_employee_ids:
                batch.append(RewardsData(
                    employee_id=employee_id,
                    award_type=row['Award_Type'],
                    award_date=parse_date(row['Award_Date']),
                    reward_points=int(row['Reward_Points'])
                ))
        
        if batch:
            RewardsData.objects.bulk_create(batch)
            print(f"Imported {len(batch)} Rewards records")
        else:
            print("No valid Rewards records found")

if __name__ == "__main__":
    # Import all datasets
    import_vibemeter_data()
    import_activity_tracker_data()
    import_rewards_data() 