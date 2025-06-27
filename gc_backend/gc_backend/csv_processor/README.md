# CSV Processor

This module provides a REST API and user interface for uploading multiple CSV files, which can then be processed by your custom script.

## Features

- Upload interface for HR data CSV files
- REST API endpoints for CSV uploads
- File validation and error handling
- Storage of CSV files in a consistent location
- Paths and URLs provided for uploaded files
- Django management command for processing uploaded files

## Required CSV Files

The HR data system requires six CSV files with specific formats:

1. **Activity Data** (`activity_file`): Contains employee activity metrics
   - Required columns: `Employee_ID`, `Date`, `Teams_Messages_Sent`, `Emails_Sent`, `Meetings_Attended`, `Work_Hours`

2. **Leave Data** (`leave_file`): Contains employee leave records
   - Required columns: `Employee_ID`, `Leave_Type`, `Leave_Start_Date`, `Leave_End_Date`, `Leave_Days`

3. **Onboarding Data** (`onboarding_file`): Contains employee onboarding information
   - Required columns: `Employee_ID`, `Joining_Date`, `Onboarding_Feedback`, `Mentor_Assigned`, `Initial_Training_Completed`

4. **Performance Data** (`performance_file`): Contains employee performance records
   - Required columns: `Employee_ID`, `Review_Period`, `Performance_Rating`, `Manager_Feedback`, `Promotion_Consideration`

5. **Rewards Data** (`rewards_file`): Contains employee reward records
   - Required columns: `Employee_ID`, `Award_Type`, `Award_Date`, `Reward_Points`

6. **Vibemeter Data** (`vibemeter_file`): Contains employee sentiment/emotion data
   - Required columns: `Employee_ID`, `Response_Date`, `Emotion_Zone`, `Vibe_Score`

## Usage

### Web Interface

1. Navigate to `/hr-metrics-upload/` in your browser
2. Upload all six required CSV files 
3. Submit the form
4. Upon successful upload, you'll receive links to all files
5. Your script can then process these files

### API Endpoint

The system provides the following REST API endpoint:

#### Upload HR Data Files

**URL**: `/api/process-hr-metrics/`  
**Method**: `POST`  
**Content-Type**: `multipart/form-data`

**Required Parameters**:
- `activity_file`: CSV file containing activity data
- `leave_file`: CSV file containing leave data
- `onboarding_file`: CSV file containing onboarding data
- `performance_file`: CSV file containing performance data
- `rewards_file`: CSV file containing rewards data
- `vibemeter_file`: CSV file containing vibemeter data

**Success Response**:
```json
{
  "success": true,
  "message": "All files uploaded successfully, ready for your script to process",
  "saved_files": {
    "activity": "/path/to/activity_file.csv",
    "leave": "/path/to/leave_file.csv",
    ...
  },
  "file_urls": {
    "activity": "/media/csv_files/activity_file.csv",
    "leave": "/media/csv_files/leave_file.csv",
    ...
  }
}
```

**Error Response**:
```json
{
  "error": "Missing required CSV files: activity, leave"
}
```

## Processing with Your Script

After uploading the files, your script can access them in the `MEDIA_ROOT/csv_files/` directory. The API response provides full paths to each file, which you can pass to your script.

### Option 1: Use the Django Management Command

The easiest way to process the uploaded files is to use the provided Django management command:

```bash
# Process files using the API response JSON
python manage.py process_hr_files --response-json /path/to/response.json --output /path/to/output.csv

# Or specify individual file paths
python manage.py process_hr_files \
  --activity /path/to/activity.csv \
  --leave /path/to/leave.csv \
  --onboarding /path/to/onboarding.csv \
  --performance /path/to/performance.csv \
  --rewards /path/to/rewards.csv \
  --vibemeter /path/to/vibemeter.csv \
  --output /path/to/output.csv
```

### Option 2: Use the Direct Script

Alternatively, you can use the script directly:

```bash
# Change to the scripts directory
cd scripts

# Run the processing script
python process_uploaded_files.py --input-json /path/to/response.json --output /path/to/output.csv
```

### Option 3: Programmatic Integration

Example Python code to upload and process the files programmatically:

```python
import requests
import subprocess
import json

def upload_and_process_files():
    # Files to upload
    files = {
        'activity_file': open('activity.csv', 'rb'),
        'leave_file': open('leave.csv', 'rb'),
        'onboarding_file': open('onboarding.csv', 'rb'),
        'performance_file': open('performance.csv', 'rb'),
        'rewards_file': open('rewards.csv', 'rb'),
        'vibemeter_file': open('vibemeter.csv', 'rb')
    }
    
    # Upload files
    response = requests.post('http://your-server/api/process-hr-metrics/', files=files)
    data = response.json()
    
    if data['success']:
        # Save the response for future use
        with open('response.json', 'w') as f:
            json.dump(data, f)
            
        # Get file paths from response
        saved_files = data['saved_files']
        
        # Run your processing script
        subprocess.run([
            'python', 'scripts/process_uploaded_files.py',
            '--input-json', 'response.json',
            '--output', 'master_hr_metrics.csv'
        ])
    else:
        print(f"Error: {data['error']}") 