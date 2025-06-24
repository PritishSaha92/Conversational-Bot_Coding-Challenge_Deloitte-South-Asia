from django.urls import path
from .views import LoginView
from .views import AdminDashboardView, EmployeeDetailView, send_healthcare_email, send_emails_to_needy_employees, FlaggedEmployeesView
from django.views.decorators.csrf import csrf_exempt
from . import views
urlpatterns = [
    path('login/', LoginView.as_view(), name='login'),
    path('admin-dashboard/<int:id>/dashboard/', AdminDashboardView.as_view(), name='admin-dashboard'),
    path('admin-dashboard/<int:id>/employee/<int:employee_id>/', EmployeeDetailView.as_view(), name='employee-detail'),
    path('send-email/', send_healthcare_email, name='send_email'),
    path('employee-needs-care/', send_emails_to_needy_employees, name='employee-needs-care'),
    path('department-hours/', views.department_avg_hours, name='department_avg_hours'),
    path('department-performance-rewards/', views.department_performance_rewards, name='department_performance_rewards'),
    path('flagged-employees/', FlaggedEmployeesView.as_view(), name='flagged-employees'),
    # path('admin-dashboard/<int:admin_id>/employee/generate-report/<int:emp_id>/', generate_employee_report.as_view(), name='generate_employee_report'),
]
