from django.urls import path
from . import views

urlpatterns = [
    path('mood/<str:employee_id>/', views.get_vibemeter_data, name='vibemeter_data'),
    path('activity/<str:employee_id>/', views.get_activity_data, name='activity_data'),
    path('rewards/<str:employee_id>/', views.get_rewards_data, name='rewards_data'),
] 