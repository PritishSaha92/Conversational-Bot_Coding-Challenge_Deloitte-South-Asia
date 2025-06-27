from django.shortcuts import get_object_or_404
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from accounts.models import CustomUser as User
from .serializers import EmployeeSerializer, ChatSummarySerializer
from django.http import FileResponse
import os
from .report_generator import EmployeeReportGenerator
from django.conf import settings
from django.utils import timezone
from .models import ChatMessage, EmployeeProfile, ChatSummary
from .serializers import ChatMessageSerializer
import json
from django.http import JsonResponse
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from scripts.ai_mood_tips import get_tips_from_mood
from django.views.decorators.csrf import csrf_exempt
from django.views import View
from django.http import HttpResponse, Http404
from employee.models import EmployeeProfile  # or whatever your actual model is
from employee.report_generator import EmployeeReportGenerator


@api_view(['GET'])
# @permission_classes([IsAuthenticated])
def employee_profile(request):
    user = get_object_or_404(User, id=request.user.id, role="employee")
    serializer = EmployeeSerializer(user)
    return Response({"user": serializer.data})


# Messages for each user
class ChatMessageListView(APIView):
    def get(self, request, user_id=None):
        """
        Get all chat messages for a specific user
        If user_id is not provided, return an error
        """
        if user_id is None:
            return Response(
                {"error": "User ID is required."}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            target_user = User.objects.get(id=user_id)
            messages = ChatMessage.objects.filter(user=target_user).order_by('timestamp')
            serializer = ChatMessageSerializer(messages, many=True)
            
            # Add metadata to the response
            response_data = {
                'count': len(messages),
                'user': {
                    'id': target_user.id,
                    'username': target_user.username,
                    'profile_pic': target_user.profile_pic
                },
                'messages': serializer.data
            }
            
            return Response(response_data, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response(
                {"error": "User not found."}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
    def post(self, request):
        """Store both user message & system response"""
        user_id = request.data.get("user_id")
        user_message = request.data.get("message")
        system_response = request.data.get("response")

        if not all([user_id, user_message, system_response]):
            return Response(
                {"error": "user_id, message, and response are required."}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response(
                {"error": "User not found."}, 
                status=status.HTTP_404_NOT_FOUND
            )

        # Store User's Message (Sent)
        user_chat = ChatMessage.objects.create(
            user=user,
            message=user_message,
            direction="sent"
        )

        # Store System's Response (Received)
        system_chat = ChatMessage.objects.create(
            user=user,
            message=system_response,
            direction="received"
        )

        # Serialize the newly created messages
        serializer = ChatMessageSerializer([user_chat, system_chat], many=True)

        return Response({
            "count": 2,
            "messages": serializer.data
        }, status=status.HTTP_201_CREATED)


# views.py
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def generate_employee_report(request):
    try:
        profile = EmployeeProfile.objects.get(user=request.user)
        generator = EmployeeReportGenerator(profile)
        return generator.generate_report()
    except EmployeeProfile.DoesNotExist:
        return Response({"error": "Employee profile not found."}, status=404)
    
@api_view(['GET'])
def generate_employee_report_id(request, id):
    from accounts.models import CustomUser as User
    try:
        user = User.objects.get(id=id,role = "employee")
        employee = EmployeeProfile.objects.get(user = user)  # get EmployeeProfile from user
        generator = EmployeeReportGenerator(employee)
        return generator.generate_report()
    except (User.DoesNotExist, EmployeeProfile.DoesNotExist):
        return Response({'error': 'Employee not found.'}, status=404)

# from accounts.models import CustomUser
# from employee.models import EmployeeProfile

def create_employee_profiles_for_all_users():
    employees = User.objects.filter(role='employee')
    for user in employees:
        EmployeeProfile.objects.get_or_create(user=user)

@csrf_exempt
def mood_tips_view(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            mood_score = int(data.get("mood_score", 3))  # Default to 3 if not provided
        except Exception as e:
            return JsonResponse({"error": "Invalid JSON or missing mood_score."}, status=400)

        tips = get_tips_from_mood(mood_score)
        return JsonResponse({"mood_score": mood_score, "tips": tips})

    return JsonResponse({"error": "Only POST requests allowed."}, status=405)

import os
from django.http import JsonResponse
from django.conf import settings
from scripts.merge_csv import merge_files

def merge_csv_view(request):
    try:
        # Define paths to input CSV files
        activity_file = os.path.join(settings.BASE_DIR, 'media/csv_files/activity_tracker.csv')
        leave_file = os.path.join(settings.BASE_DIR, 'media/csv_files/leave.csv')
        onboarding_file = os.path.join(settings.BASE_DIR, 'media/csv_files/onboarding.csv')
        performance_file = os.path.join(settings.BASE_DIR, 'media/csv_files/performance.csv')
        rewards_file = os.path.join(settings.BASE_DIR, 'media/csv_files/rewards.csv')
        vibemeter_file = os.path.join(settings.BASE_DIR, 'media/csv_files/vibemeter.csv')

        # Define output path for the merged CSV file
        output_file = os.path.join(settings.MEDIA_ROOT, 'media/csv_files/master_dataset.csv')

        # Call the merge_files function
        merge_files(activity_file, leave_file, onboarding_file, performance_file, rewards_file, vibemeter_file, output_file)

        return JsonResponse({"message": "CSV files merged successfully", "output": output_file}, status=200)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

import random
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

@csrf_exempt
def mood_percentages_view(request):
    mood_labels = ["1", "2", "3", "4", "5", "6"]

    # Generate 6 random numbers
    raw_values = [random.randint(1, 100) for _ in range(6)]

    # Normalize to make their sum = 100
    total = sum(raw_values)
    mood_percentages = {
        mood: round((value / total) * 100)
        for mood, value in zip(mood_labels, raw_values)
    }
    
    return JsonResponse({"percentages": mood_percentages})

@api_view(['GET'])
def anomaly_summary_csv(request):
    """Serves the anomaly_summary CSV file."""
    try:
        file_path = os.path.join(settings.BASE_DIR, 'media/csv_files/anomaly_summary')
        if os.path.exists(file_path):
            response = FileResponse(open(file_path, 'rb'), content_type='text/csv')
            response['Content-Disposition'] = 'attachment; filename="anomaly_summary.csv"'
            return response
        else:
            return Response({"error": "Anomaly summary file not found."}, status=404)
    except Exception as e:
        return Response({"error": str(e)}, status=500)

@api_view(['GET'])
def get_chat_summary(request, employee_id):
    """
    Get chat summary for a specific employee by their ID
    """
    try:
        # Find the user by ID
        user = User.objects.get(id=employee_id, role="employee")
        
        # Get their most recent chat summary
        chat_summary = ChatSummary.objects.filter(user=user).order_by('-updated_at').first()
        
        if not chat_summary:
            return Response({"error": "No chat summary found for this employee."}, status=404)
        
        serializer = ChatSummarySerializer(chat_summary)
        return Response(serializer.data)
    
    except User.DoesNotExist:
        return Response({"error": "Employee not found."}, status=404)

@api_view(['GET'])
def department_mood_averages(request):
    """
    Return department-wise average mood data from CustomUser model.
    """
    try:
        # Get users with valid department and mood_history values
        users = User.objects.filter(
            department__isnull=False,
            mood_history__isnull=False
        ).exclude(department='')
        
        # Group users by department and calculate average mood
        department_data = {}
        
        for user in users:
            department = user.department
            mood = user.mood_history
            
            if department not in department_data:
                department_data[department] = {
                    'total_mood': mood,
                    'count': 1
                }
            else:
                department_data[department]['total_mood'] += mood
                department_data[department]['count'] += 1
        
        # Calculate averages
        result = {}
        for department, data in department_data.items():
            result[department] = round(data['total_mood'] / data['count'], 2)
        
        return Response({
            "department_mood_averages": result,
            "total_departments": len(result)
        })
    
    except Exception as e:
        return Response({"error": str(e)}, status=500)
