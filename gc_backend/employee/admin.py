from django.contrib import admin
from .models import EmployeeProfile, ChatMessage, ChatSummary

# Register your models here.
admin.site.register(EmployeeProfile)
admin.site.register(ChatMessage)
admin.site.register(ChatSummary)
