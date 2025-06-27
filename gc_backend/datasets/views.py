from django.shortcuts import render
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import VibeMeterData, ActivityTrackerData, RewardsData
from django.core.serializers import serialize
import json

# Create your views here.

@api_view(['GET'])
def get_vibemeter_data(request, employee_id):
    data = VibeMeterData.objects.filter(employee_id=employee_id).values()
    return Response(list(data))

@api_view(['GET'])
def get_activity_data(request, employee_id):
    data = ActivityTrackerData.objects.filter(employee_id=employee_id).values()
    return Response(list(data))

@api_view(['GET'])
def get_rewards_data(request, employee_id):
    data = RewardsData.objects.filter(employee_id=employee_id).values()
    return Response(list(data))
