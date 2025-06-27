import os
import csv
import datetime
import psycopg2
from psycopg2 import sql

def parse_date(date_str):
    """Parse date strings from the CSV files into database-compatible date objects"""
    # Format: DD-MM-YYYY (vibemeter_dataset)
    if '-' in date_str and len(date_str.split('-')[0]) <= 2:
        day, month, year = date_str.split('-')
        return f"{year}-{month}-{day}"
    # Format: M/D/YYYY (activity_tracker_dataset)
    elif '/' in date_str:
        month, day, year = date_str.split('/')
        return f"{year}-{month.zfill(2)}-{day.zfill(2)}"
    # Format: YYYY-MM-DD (rewards_dataset) - already in correct format
    else:
        return date_str

def create_tables(conn):
    """Create tables if they don't exist"""
    cur = conn.cursor()
    
    # Create vibemeter_data table
    cur.execute("""
    CREATE TABLE IF NOT EXISTS vibemeter_data (
        id SERIAL PRIMARY KEY,
        employee_id VARCHAR(10) NOT NULL,
        response_date DATE NOT NULL,
        vibe_score INTEGER NOT NULL
    )
    """)
    
    # Create activity_tracker_data table
    cur.execute("""
    CREATE TABLE IF NOT EXISTS activity_tracker_data (
        id SERIAL PRIMARY KEY,
        employee_id VARCHAR(10) NOT NULL,
        date DATE NOT NULL,
        teams_messages_sent INTEGER NOT NULL,
        emails_sent INTEGER NOT NULL,
        meetings_attended INTEGER NOT NULL,
        work_hours FLOAT NOT NULL
    )
    """)
    
    # Create rewards_data table
    cur.execute("""
    CREATE TABLE IF NOT EXISTS rewards_data (
        id SERIAL PRIMARY KEY,
        employee_id VARCHAR(10) NOT NULL,
        award_type VARCHAR(50) NOT NULL,
        award_date DATE NOT NULL,
        reward_points INTEGER NOT NULL
    )
    """)
    
    conn.commit()
    print("Tables created successfully")

def get_valid_employee_ids(conn):
    """Get a list of valid employee IDs from the accounts_customuser table"""
    cur = conn.cursor()
    cur.execute("SELECT company_id FROM accounts_customuser")
    employee_ids = [row[0] for row in cur.fetchall()]
    return set(employee_ids)

def import_vibemeter_data(conn, valid_employee_ids):
    """Import data from vibemeter_dataset.csv"""
    print("Importing VibeMeter data...")
    
    # Clear existing data (optional)
    cur = conn.cursor()
    cur.execute("DELETE FROM vibemeter_data")
    
    # Import data for employees that exist in accounts_customuser
    base_dir = os.path.dirname(os.path.dirname(__file__))
    filepath = os.path.join(base_dir, 'vibemeter_dataset.csv')
    
    if not os.path.exists(filepath):
        print(f"File not found: {filepath}")
        return
    
    processed_count = 0
    with open(filepath, 'r') as csv_file:
        reader = csv.DictReader(csv_file)
        for row in reader:
            employee_id = row['Employee_ID']
            if employee_id in valid_employee_ids:
                cur.execute(
                    """
                    INSERT INTO vibemeter_data (employee_id, response_date, vibe_score)
                    VALUES (%s, %s, %s)
                    """,
                    (
                        employee_id,
                        parse_date(row['Response_Date']),
                        int(row['Vibe_Score'])
                    )
                )
                processed_count += 1
    
    conn.commit()
    print(f"Imported {processed_count} VibeMeter records")

def import_activity_tracker_data(conn, valid_employee_ids):
    """Import data from activity_tracker_dataset.csv"""
    print("Importing Activity Tracker data...")
    
    # Clear existing data (optional)
    cur = conn.cursor()
    cur.execute("DELETE FROM activity_tracker_data")
    
    # Import data
    base_dir = os.path.dirname(os.path.dirname(__file__))
    filepath = os.path.join(base_dir, 'activity_tracker_dataset.csv')
    
    if not os.path.exists(filepath):
        print(f"File not found: {filepath}")
        return
    
    processed_count = 0
    with open(filepath, 'r') as csv_file:
        reader = csv.DictReader(csv_file)
        for row in reader:
            employee_id = row['Employee_ID']
            if employee_id in valid_employee_ids:
                cur.execute(
                    """
                    INSERT INTO activity_tracker_data 
                    (employee_id, date, teams_messages_sent, emails_sent, meetings_attended, work_hours)
                    VALUES (%s, %s, %s, %s, %s, %s)
                    """,
                    (
                        employee_id,
                        parse_date(row['Date']),
                        int(row['Teams_Messages_Sent']),
                        int(row['Emails_Sent']),
                        int(row['Meetings_Attended']),
                        float(row['Work_Hours'])
                    )
                )
                processed_count += 1
    
    conn.commit()
    print(f"Imported {processed_count} Activity Tracker records")

def import_rewards_data(conn, valid_employee_ids):
    """Import data from rewards_dataset.csv"""
    print("Importing Rewards data...")
    
    # Clear existing data (optional)
    cur = conn.cursor()
    cur.execute("DELETE FROM rewards_data")
    
    # Import data
    base_dir = os.path.dirname(os.path.dirname(__file__))
    filepath = os.path.join(base_dir, 'rewards_dataset.csv')
    
    if not os.path.exists(filepath):
        print(f"File not found: {filepath}")
        return
    
    processed_count = 0
    with open(filepath, 'r') as csv_file:
        reader = csv.DictReader(csv_file)
        for row in reader:
            employee_id = row['Employee_ID']
            if employee_id in valid_employee_ids:
                cur.execute(
                    """
                    INSERT INTO rewards_data (employee_id, award_type, award_date, reward_points)
                    VALUES (%s, %s, %s, %s)
                    """,
                    (
                        employee_id,
                        row['Award_Type'],
                        parse_date(row['Award_Date']),
                        int(row['Reward_Points'])
                    )
                )
                processed_count += 1
    
    conn.commit()
    print(f"Imported {processed_count} Rewards records")

def main():
    # PostgreSQL connection parameters from settings.py
    conn_params = {
        'dbname': 'opensoftdata',
        'user': 'opensoftdata_user',
        'password': 'WU5YC7TJuN5gJHqUTkb9rCz43BPaCQpv',
        'host': 'dpg-cvklai0gjchc73ce53cg-a.oregon-postgres.render.com',
        'port': '5432',
        'sslmode': 'require'
    }
    
    try:
        # Connect to PostgreSQL
        print("Connecting to PostgreSQL database...")
        conn = psycopg2.connect(**conn_params)
        
        # Create tables if they don't exist
        create_tables(conn)
        
        # Get valid employee IDs
        valid_employee_ids = get_valid_employee_ids(conn)
        print(f"Found {len(valid_employee_ids)} valid employee IDs")
        
        # Import data
        import_vibemeter_data(conn, valid_employee_ids)
        import_activity_tracker_data(conn, valid_employee_ids)
        import_rewards_data(conn, valid_employee_ids)
        
        # Close the connection
        conn.close()
        print("Data import completed successfully")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main() 