from django.db import models
from accounts.models import CustomUser as User




class EmployeeProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='employee_profile')
    department = models.CharField(max_length=100)
    role = models.CharField(max_length=50, default='employee')
    profile_pic = models.URLField(blank=True, null=True)

    def __str__(self):
        return self.user.username
    

# chat messages
class ChatMessage(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="chat_messages")
    message = models.TextField()
    direction = models.CharField(max_length=10, choices=[('sent', 'Sent'), ('received', 'Received')])
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.direction}: {self.message[:20]}"


# chat summary
class ChatSummary(models.Model):
    user_id = models.ForeignKey(User, on_delete=models.CASCADE, related_name="chat_summaries")
    summary_data = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Chat Summary for {self.user.username} ({self.updated_at.strftime('%Y-%m-%d')})"
    
    class Meta:
        verbose_name_plural = "Chat Summaries"

