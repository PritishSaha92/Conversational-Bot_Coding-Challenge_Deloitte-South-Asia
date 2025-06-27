from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status,permissions
from rest_framework.decorators import api_view
from django.shortcuts import get_object_or_404
from .serializers import LoginSerializer
from django.contrib.auth import authenticate
from django.http import HttpResponse
from django.conf import settings
from django.core.mail import send_mail
from django.views.decorators.csrf import csrf_exempt
from django.core.mail import send_mail
from django.http import JsonResponse
import json
from .models import Employeeneedscare
import random   
from django.db.models import Avg, Sum
from datasets.models import RewardsData
from employee.models import ChatMessage
from employee.serializers import ChatMessageSerializer

from .models import CustomUser
from .serializers import EmployeeSerializer, EmployeeDetailSerializer


# class LoginView(APIView):
#     def post(self, request):
#         serializer = LoginSerializer(data=request.data)
#         if serializer.is_valid():
#             return Response(serializer.validated_data, status=status.HTTP_200_OK)

#         return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    

# changed to return role
class LoginView(APIView):
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            validated_data = serializer.validated_data
            user = authenticate(username=request.data.get('username'), password=request.data.get('password'))

            if user:
                validated_data["role"] = user.role  # ✅ manually adding role
                validated_data["is_flagged"] = user.is_flagged  # Flag added
                validated_data["id"] = user.id
                # Check for notifications if user is an employee
                if user.role == 'employee':
                    from datasets.models import TablesEmployee
                    
                    try:
                        employee = TablesEmployee.objects.get(employee_id=user.company_id)
                        notifications = employee.notifications or []
                        has_unsent = False
                        
                        # Check and update unsent notifications
                        for notification in notifications:
                            if not notification['sent']:
                                has_unsent = True
                                notification['sent'] = True
                        
                        # Add notified field to response
                        validated_data["notified"] = has_unsent
                        
                        # Save updated notifications
                        if has_unsent:
                            employee.notifications = notifications
                            employee.save()
                    except TablesEmployee.DoesNotExist:
                        validated_data["notified"] = False
                else:
                    validated_data["notified"] = False
                
                return Response(validated_data, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# Added by harsh - Admin Dashboard
class IsAdminPermission(permissions.BasePermission):
    """Custom permission to allow only admins to access these endpoints."""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'admin'

class AdminDashboardView(APIView):
    """Returns a list of employees for a given admin"""
    permission_classes = [IsAdminPermission]

    def get(self, request, id):
        admin = get_object_or_404(CustomUser, id=id, role='admin')

        if not admin:
            return Response({"error": "Admin not found"}, status=status.HTTP_404_NOT_FOUND)

        employees = CustomUser.objects.filter(role='employee')
        data = EmployeeSerializer(employees, many=True).data
        return Response({'employees': data}, status=status.HTTP_200_OK)

class EmployeeDetailView(APIView):
    """Returns details of a specific employee"""
    permission_classes = [IsAdminPermission]

    def get(self, request, id, employee_id):
        admin = get_object_or_404(CustomUser, id=id, role='admin')
        employee = get_object_or_404(CustomUser, id=employee_id, role='employee', company_id=admin.company_id)
        data = EmployeeDetailSerializer(employee).data
        return Response(data, status=status.HTTP_200_OK)

@csrf_exempt
def send_healthcare_email(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            recipient_email = data.get("recipient_email")
            
            if not recipient_email:
                return JsonResponse({"error": "Recipient email is required"}, status=400)

            send_mail(
                subject="Attention",
                message="Healthcare is needed,please contact the hr",
                from_email="devbawari4@example.com",
                recipient_list=[recipient_email]
            )

            return JsonResponse({"message": f"Email successfully sent to {recipient_email}"}, status=200)
        
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)
    else:
        return JsonResponse({"error": "Invalid request method"}, status=405)


@csrf_exempt  # Remove this in production and use CSRF token
def send_emails_to_needy_employees(request):
    if request.method == "POST":
        needy_employees = Employeeneedscare.objects.filter(needs_attention=True)

        if not needy_employees.exists():
            return JsonResponse({"message": "No employees need attention"}, status=200)

        failed_emails = []
        
        for employee in needy_employees:
            try:
                send_mail(
                    subject="Attention",
                    message="Healthcare is needed",
                    from_email="devbawari4@example.com",
                    recipient_list=[employee.email]
                )
            except Exception as e:
                failed_emails.append(employee.email)

       
        return JsonResponse({
            "message": f"Emails sent successfully to {needy_employees.count()} employees.",
            "failed_emails": failed_emails
        }, status=200)
    
    return JsonResponse({"error": "Invalid request method"}, status=405)

def department_avg_hours(request):
    # Get average work hours grouped by department
    dept_averages = CustomUser.objects.values('department')\
        .annotate(avg_hours=Avg('avg_work_hours'))\
        .filter(department__isnull=False)  # Exclude null departments
    
    # Format the response data
    data = {
        'department_averages': [
            {
                'department': dept['department'],
                'average_hours': round(dept['avg_hours'], 2) if dept['avg_hours'] else 0
            }
            for dept in dept_averages
        ]
    }
    
    return JsonResponse(data)

@api_view(['GET'])
def department_performance_rewards(request):
    """
    Get department-wise performance activity and reward points.
    """
    # Get all departments
    departments = CustomUser.objects.values_list('department', flat=True).distinct()
    
    result = []
    for department in departments:
        if department:  # Skip None/empty departments
            # Get users in this department
            users = CustomUser.objects.filter(department=department)
            
            # Calculate average performance activity for the department
            avg_performance = users.aggregate(avg_perf=Avg('performance_activity'))['avg_perf'] or 0
            
            # Get total reward points for users in this department
            total_rewards = RewardsData.objects.filter(
                employee_id__in=users.values_list('company_id', flat=True)
            ).aggregate(total=Sum('reward_points'))['total'] or 0
            
            result.append({
                'department': department,
                'avg_performance_activity': round(avg_performance, 2),
                'total_reward_points': total_rewards,
                'employee_count': users.count()
            })
    
    return Response(result)

class FlaggedEmployeesView(APIView):
    """Returns a list of employees who have been flagged"""
    permission_classes = [IsAdminPermission]

    def get(self, request):
        flagged_employees = CustomUser.objects.filter(is_flagged=True, role='employee')
        data = EmployeeSerializer(flagged_employees, many=True).data
        return Response({'flagged_employees': data}, status=status.HTTP_200_OK)
