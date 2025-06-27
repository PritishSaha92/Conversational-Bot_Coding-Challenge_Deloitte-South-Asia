from django.contrib.auth.models import AbstractUser
from django.db import models
from django.db.models import Avg, Sum
from datasets.models import ActivityTrackerData, RewardsData

class CustomUser(AbstractUser):
    company_id = models.CharField(max_length=100, unique=True)  # Company ID field
    role = models.CharField(max_length=50, choices=[  # Role field with predefined choices
        ('admin', 'Admin'),
        ('employee', 'Employee'),
    ], default='employee')

    # Add missing fields
    # name = models.CharField(max_length=100, blank=True, null=True)
    is_flagged = models.BooleanField(default=False)
    post = models.CharField(max_length=100, blank=True, null=True)
    phone = models.CharField(max_length=15, blank=True, null=True)
    department = models.CharField(max_length=100, blank=True, null=True)
    profile_pic = models.URLField(blank=True, null=True)
    avg_work_hours = models.FloatField(blank=True, null=True, default=0.0)  # Average work hours field
    performance_activity = models.FloatField(blank=True, null=True, default=0.0)  # Performance activity score
    mood_history = models.IntegerField(blank=True, null=True, default=0)  # User's mood history data

    def __str__(self):
        return f"{self.username} - {self.role} (Company: {self.company_id})"

class Employeeneedscare(models.Model):
    name = models.CharField(max_length=255)
    email = models.EmailField(unique=True)
    needs_attention = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.name} ({'Needs Attention' if self.needs_attention else 'Normal'})"