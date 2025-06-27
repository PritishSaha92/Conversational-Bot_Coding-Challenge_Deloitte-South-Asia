from django.db import models

# Create your models here.

class VibeMeterData(models.Model):
    employee_id = models.CharField(max_length=10)
    response_date = models.DateField()
    vibe_score = models.IntegerField()
    
    class Meta:
        db_table = 'vibemeter_data'
        
    def __str__(self):
        return f"{self.employee_id} - {self.response_date}"
        
class ActivityTrackerData(models.Model):
    employee_id = models.CharField(max_length=10)
    date = models.DateField()
    teams_messages_sent = models.IntegerField()
    emails_sent = models.IntegerField()
    meetings_attended = models.IntegerField()
    work_hours = models.FloatField()
    
    class Meta:
        db_table = 'activity_tracker_data'
        
    def __str__(self):
        return f"{self.employee_id} - {self.date}"
        
class RewardsData(models.Model):
    employee_id = models.CharField(max_length=10)
    award_type = models.CharField(max_length=50)
    award_date = models.DateField()
    reward_points = models.IntegerField()
    
    class Meta:
        db_table = 'rewards_data'
        
    def __str__(self):
        return f"{self.employee_id} - {self.award_type} - {self.award_date}"

class TablesEmployee(models.Model):
    employee_id = models.CharField(max_length=10, primary_key=True)
    mood = models.FloatField(null=True, blank=True)
    problems = models.JSONField(null=True, blank=True)
    is_alerted = models.BooleanField(default=False)
    notifications = models.JSONField(default=list)  # List of notification objects with sent field
    
    class Meta:
        db_table = 'tables_employee'
        
    def __str__(self):
        return f"{self.employee_id} - {self.mood}"
