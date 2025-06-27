from django.urls import path
from .views import employee_profile, ChatMessageListView, generate_employee_report,generate_employee_report_id,mood_tips_view,merge_csv_view,mood_percentages_view,anomaly_summary_csv, get_chat_summary, department_mood_averages
from .notification_views import check_notification, test_admin_alert, mark_employee_alerted

urlpatterns = [
    path('profile/', employee_profile, name='employee-profile'),
    path('chat/', ChatMessageListView.as_view(), name='chat-messages'),
    path('generate-report/', generate_employee_report, name='employee-report'),
    path('<int:id>/generate-report/', generate_employee_report_id, name='generate_employee_report'),
    path('ai-mood-tips/', mood_tips_view, name='ai_mood_tips'),
    path('merge-csv/', merge_csv_view, name='merge_csv'),
    path('mood-percentages/', mood_percentages_view, name='mood_percentages'),
    path('notification/check/', check_notification, name='check-notification'),
    path('notification/test-admin-alert/', test_admin_alert, name='test-admin-alert'),
    path('notification/mark-alerted/', mark_employee_alerted, name='mark-employee-alerted'),
    path('anomaly-summary/', anomaly_summary_csv, name='anomaly_summary_csv'),
    path('<int:employee_id>/chat-summary/', get_chat_summary, name='employee-chat-summary'),
    path('department-mood-averages/', department_mood_averages, name='department-mood-averages'),
]
