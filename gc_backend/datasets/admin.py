from django.contrib import admin
from .models import VibeMeterData, ActivityTrackerData, RewardsData

admin.site.register(VibeMeterData)
admin.site.register(ActivityTrackerData)
admin.site.register(RewardsData)
