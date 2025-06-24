import os
import subprocess
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings
from rest_framework.decorators import api_view, parser_classes
from rest_framework.parsers import MultiPartParser
import pandas as pd
from django.core.files.storage import default_storage
import numpy as np
import json
# views.py
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings
import os
from .merge_utils import merge_files
from .merge_utils import gen

def run_anomaly_detection(request):
    input_csv_path = os.path.join(settings.MEDIA_ROOT, "csv_files", "master_df")
    output_csv_path = os.path.join(settings.MEDIA_ROOT, "csv_files", "anomaly_summary")
    try:
        if not os.path.exists(input_csv_path):
            return JsonResponse({"error": f"File not found: {input_csv_path}"}, status=400)

        # Run the anomaly detection logic
        gen(input_csv_path, output_csv_path)

        return JsonResponse({
            "message": "Anomaly detection completed successfully",
            "output_csv": output_csv_path
        })

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
def merge_hr_csv(request):
    if request.method == 'POST':
        try:
            base_dir = os.path.join(settings.BASE_DIR, 'media/csv_files/')

            activity_file = os.path.join(base_dir, 'activity_tracker')
            leave_file = os.path.join(base_dir, 'leave')
            onboarding_file = os.path.join(base_dir, 'onboarding')
            performance_file = os.path.join(base_dir, 'performance')
            rewards_file = os.path.join(base_dir, 'rewards')
            vibemeter_file = os.path.join(base_dir, 'vibemeter')
            output_file = os.path.join(base_dir, 'master_df')

            merge_files(
                activity_file=activity_file,
                leave_file=leave_file,
                onboarding_file=onboarding_file,
                performance_file=performance_file,
                rewards_file=rewards_file,
                vibemeter_file=vibemeter_file,
                output_file=output_file
            )

            return JsonResponse({'message': 'Master dataframe created successfully', 'output': f'/media/csv_files/master_df.csv'})
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)

    return JsonResponse({'error': 'Only POST method allowed'}, status=405)



@csrf_exempt
@api_view(['POST'])
@parser_classes([MultiPartParser])
def process_hr_metrics(request):
    """
    View to handle receiving multiple CSV files for HR metrics.
    
    Just saves the uploaded files without processing them.
    Your script will handle the actual merging.
    
    Required CSV files:
    - activity.csv: Employee activity metrics
    - leave.csv: Employee leave data
    - onboarding.csv: Employee onboarding information
    - performance.csv: Employee performance reviews
    - rewards.csv: Employee rewards data
    - vibemeter.csv: Employee sentiment/emotion data
    
    Returns:
    - JSON response with the file paths
    """
    # Create directories if they don't exist
    csv_dir = os.path.join(settings.MEDIA_ROOT, 'csv_files')
    os.makedirs(csv_dir, exist_ok=True)
    
    # Required CSV files
    required_files = [
        'activity_tracker', 'leave', 'onboarding', 
        'performance', 'rewards', 'vibemeter'
    ]
    
    # Check if all required files are uploaded
    missing_files = []
    for file_key in required_files:
        if f'{file_key}' not in request.FILES:
            missing_files.append(file_key)
    
    if missing_files:
        return JsonResponse({
            'error': f'Missing required CSV files: {", ".join(missing_files)}',
            'required_files': required_files
        }, status=400)
    
    # Save all uploaded files
    saved_files = {}
    file_urls = {}
    media_url = settings.MEDIA_URL.rstrip('/')
    
    for file_key in required_files:
        uploaded_file = request.FILES[f'{file_key}']
        if not uploaded_file.name.endswith('.csv'):
            return JsonResponse({
                'error': f'Uploaded file {uploaded_file.name} must be a CSV'
            }, status=400)
        
        # Save file with original name but prefixed with file type
        safe_filename = f"{file_key}"
        file_path = os.path.join(csv_dir, safe_filename)
        
        with open(file_path, 'wb+') as destination:
            for chunk in uploaded_file.chunks():
                destination.write(chunk)
                
        saved_files[file_key] = file_path
        file_urls[file_key] = f"{media_url}/csv_files/{safe_filename}"
    
    # Return the paths to all saved files
    return JsonResponse({
        'success': True,
        'message': 'All files uploaded successfully, ready for your script to process',
        'saved_files': saved_files,
        'file_urls': file_urls
    })

@csrf_exempt
def merge_hr_files(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'Only POST method is allowed'}, status=405)
    
    try:
        # Get files from request
        activity_file = request.FILES.get('activity_file')
        leave_file = request.FILES.get('leave_file')
        onboarding_file = request.FILES.get('onboarding_file')
        performance_file = request.FILES.get('performance_file')
        rewards_file = request.FILES.get('rewards_file')
        vibemeter_file = request.FILES.get('vibemeter_file')

        # Validate all files are present
        if not all([activity_file, leave_file, onboarding_file, performance_file, rewards_file, vibemeter_file]):
            return JsonResponse({'error': 'All files are required'}, status=400)

        # Create temp directory if it doesn't exist
        temp_dir = os.path.join(settings.MEDIA_ROOT, 'temp')
        os.makedirs(temp_dir, exist_ok=True)

        # Save files temporarily
        temp_files = {}
        for file_name, file_obj in [
            ('activity.csv', activity_file),
            ('leave.csv', leave_file),
            ('onboarding.csv', onboarding_file),
            ('performance.csv', performance_file),
            ('rewards.csv', rewards_file),
            ('vibemeter.csv', vibemeter_file)
        ]:
            file_path = os.path.join('temp', file_name)
            with default_storage.open(file_path, 'wb+') as destination:
                for chunk in file_obj.chunks():
                    destination.write(chunk)
            temp_files[file_name] = file_path

        # Process files using pandas
        activity_df = pd.read_csv(default_storage.open(temp_files['activity.csv']), parse_dates=['Date'])
        leave_df = pd.read_csv(default_storage.open(temp_files['leave.csv']), parse_dates=['Leave_Start_Date', 'Leave_End_Date'])
        onboarding_df = pd.read_csv(default_storage.open(temp_files['onboarding.csv']), parse_dates=['Joining_Date'])
        perf_df = pd.read_csv(default_storage.open(temp_files['performance.csv']))
        rewards_df = pd.read_csv(default_storage.open(temp_files['rewards.csv']), parse_dates=['Award_Date'])
        vibe_df = pd.read_csv(default_storage.open(temp_files['vibemeter.csv']), parse_dates=['Response_Date'])

        # Set decay constant
        lambda_decay = 0.01

        # Process Activity DataFrame
        activity_df.columns = activity_df.columns.str.strip()

        activity_summary = activity_df.groupby('Employee_ID').agg({
            'Teams_Messages_Sent': ['sum', 'mean', 'median', 'std'],
            'Emails_Sent': ['sum', 'mean', 'median', 'std'],
            'Meetings_Attended': ['sum', 'mean', 'median', 'std'],
            'Work_Hours': ['sum', 'mean', 'median', 'std'],
            'Date': ['max', 'count']
        }).reset_index()

        # Fill missing standard deviation values with 0
        std_columns = [col for col in activity_summary.columns if col[1].endswith('std')]
        activity_summary[std_columns] = activity_summary[std_columns].fillna(0)

        # Flatten MultiIndex columns
        def flatten_columns(df):
            if isinstance(df.columns, pd.MultiIndex):
                df.columns = ['_'.join(map(str, col)).strip('_') for col in df.columns.values]
            return df

        activity_summary = flatten_columns(activity_summary)
        activity_summary.rename(columns={'Date_max': 'Last_activity_entry', 'Date_count': 'Total_activity_entry'}, inplace=True)

        # Process Leave DataFrame
        leave_df.columns = leave_df.columns.str.strip()

        reference_date = leave_df.Leave_End_Date.max()
        leave_df['Delta_Days'] = (reference_date - leave_df['Leave_End_Date']).dt.days
        leave_df['Leave_Factor'] = leave_df['Leave_Days'] * np.exp(-lambda_decay * leave_df['Delta_Days'])
        
        leave_factor = leave_df.groupby(['Employee_ID', 'Leave_Type'])['Leave_Factor'].sum().reset_index()
        leave_factor_pivot = leave_factor.pivot(index='Employee_ID', columns='Leave_Type', values='Leave_Factor').reset_index()
        leave_factor_pivot = leave_factor_pivot.fillna(0)
        leave_summary = leave_factor_pivot.rename(columns=lambda x: x + '_Factor' if x != 'Employee_ID' else x)

        # Process Onboarding DataFrame
        onboarding_df.columns = onboarding_df.columns.str.strip()
        onboarding_df['Onboarding_Feedback'] = onboarding_df['Onboarding_Feedback'].astype(str).str.strip()
        onboarding_df['Mentor_Assigned'] = onboarding_df['Mentor_Assigned'].astype(str).str.strip().map({'True': True, 'False': False})
        onboarding_df['Initial_Training_Completed'] = onboarding_df['Initial_Training_Completed'].astype(str).str.strip().map({'True': True, 'False': False})

        onboarding_summary = onboarding_df.groupby('Employee_ID', as_index=False).agg({
            'Joining_Date': 'first',
            'Onboarding_Feedback': 'last',
            'Mentor_Assigned': 'last',
            'Initial_Training_Completed': 'last'
        })

        feedback_mapping = {
            'Excellent': 3,
            'Poor': 0,
            'Average': 1,
            'Good': 2
        }
        onboarding_summary['Feedback_Score'] = onboarding_summary['Onboarding_Feedback'].map(feedback_mapping)
        reference_date = onboarding_summary.Joining_Date.max()
        onboarding_summary['Days_Since_Joining'] = (reference_date - onboarding_summary['Joining_Date']).dt.days

        onboarding_summary['Decay_Factor'] = np.exp(-lambda_decay * onboarding_summary['Days_Since_Joining'])
        onboarding_summary['Onboarding_Factor'] = onboarding_summary['Feedback_Score'] * onboarding_summary['Decay_Factor']
        onboarding_summary.drop(['Decay_Factor', 'Feedback_Score'], axis=1, inplace=True)

        # Process Performance DataFrame
        perf_df.columns = perf_df.columns.str.strip()
        perf_df['Review_Period'] = perf_df['Review_Period'].astype(str).str.strip()
        perf_df['Manager_Feedback'] = perf_df['Manager_Feedback'].astype(str).str.strip()
        perf_df['Performance_Rating'] = pd.to_numeric(perf_df['Performance_Rating'], errors='coerce')
        perf_df['Promotion_Consideration'] = perf_df['Promotion_Consideration'].astype(str).str.strip().map({
            'TRUE': True, 'FALSE': False, 'True': True, 'False': False
        })
        
        perf_df[['Period', 'Year']] = perf_df['Review_Period'].str.split(' ', expand=True)
        perf_df['Year'] = pd.to_numeric(perf_df['Year'], errors='coerce')
        period_mapping = {'H1': 1, 'H2': 2, 'Annual': 3}
        perf_df['Period_Order'] = perf_df['Period'].map(period_mapping)
        perf_df_sorted = perf_df.sort_values(['Employee_ID', 'Year', 'Period_Order'], ascending=[True, False, False])
        perf_summary = perf_df_sorted.groupby('Employee_ID', as_index=False).first()
        perf_summary = perf_summary.drop(columns=['Review_Period', 'Period_Order'])
        perf_summary = perf_summary.rename(columns={'Period': 'Last_Review_Period', 'Year': 'Last_Review_Year'})

        # Process Rewards DataFrame
        rewards_df.columns = rewards_df.columns.str.strip()
        rewards_df['Award_Type'] = rewards_df['Award_Type'].astype(str).str.strip()
        rewards_df['Reward_Points'] = pd.to_numeric(rewards_df['Reward_Points'], errors='coerce')
        reference_date = rewards_df.Award_Date.max()
        rewards_df['Days_Since_Award'] = (reference_date - rewards_df['Award_Date']).dt.days
        rewards_df['Decayed_Reward_Points'] = rewards_df['Reward_Points'] * np.exp(-lambda_decay * rewards_df['Days_Since_Award'])

        reward_counts = rewards_df.groupby(['Employee_ID', 'Award_Type']).size().reset_index(name='Reward_Count')
        reward_counts_pivot = reward_counts.pivot(index='Employee_ID', columns='Award_Type', values='Reward_Count').reset_index()
        reward_counts_pivot = reward_counts_pivot.fillna(0)
        reward_counts_pivot.columns = ['Employee_ID'] + [f"{col}_Count" for col in reward_counts_pivot.columns if col != 'Employee_ID']

        decayed_points_total = rewards_df.groupby('Employee_ID')['Decayed_Reward_Points'].sum().reset_index()
        decayed_points_total = decayed_points_total.rename(columns={'Decayed_Reward_Points': 'Total_Decayed_Reward_Points'})
        rewards_summary = pd.merge(reward_counts_pivot, decayed_points_total, on='Employee_ID', how='outer')

        # Process Vibemeter DataFrame
        vibe_df.columns = vibe_df.columns.str.strip()
        vibe_df['Emotion_Zone'] = vibe_df['Emotion_Zone'].astype(str).str.strip()

        emotion_mapping = {
            'Frustrated Zone': -3,
            'Sad Zone': -2,
            'Leaning to Sad Zone': -1,
            'Neutral Zone (OK)': 0,
            'Leaning to Happy Zone': 1,
            'Happy Zone': 2,
            'Excited Zone': 3
        }
        vibe_df['Emotion_Value'] = vibe_df['Emotion_Zone'].map(emotion_mapping)
        reference_date = vibe_df.Response_Date.max()
        vibe_df['Days_Since_Response'] = (reference_date - vibe_df['Response_Date']).dt.days

        lambda_decay1, lambda_decay2 = 0.005, 0.005
        vibe_df['Decayed_Emotion_Zone'] = vibe_df['Emotion_Value'] * np.exp(-lambda_decay1 * vibe_df['Days_Since_Response'])
        vibe_df['Decayed_Vibe'] = vibe_df['Vibe_Score'] * np.exp(-lambda_decay2 * vibe_df['Days_Since_Response'])
        
        vibe_summary = vibe_df.groupby('Employee_ID').agg({
            'Decayed_Emotion_Zone': 'sum',
            'Decayed_Vibe': 'sum'
        }).reset_index()

        # Merge All Summaries
        master_df = activity_summary.merge(leave_summary, on='Employee_ID', how='outer') \
                                    .merge(onboarding_summary, on='Employee_ID', how='outer') \
                                    .merge(perf_summary, on='Employee_ID', how='outer') \
                                    .merge(rewards_summary, on='Employee_ID', how='outer') \
                                    .merge(vibe_summary, on='Employee_ID', how='outer')

        if 'Decayed_Emotion_Zone' in master_df.columns:
            master_df.drop(columns=['Decayed_Emotion_Zone'], axis=1, inplace=True)

        # Clean up temporary files
        for file_path in temp_files.values():
            default_storage.delete(file_path)

        return JsonResponse({
            'message': 'Files processed successfully',
            'data': master_df.to_dict(orient='records')
        })

    except Exception as e:
        # Clean up temporary files in case of error
        for file_path in temp_files.values():
            try:
                default_storage.delete(file_path)
            except:
                pass
        return JsonResponse({'error': str(e)}, status=500) 