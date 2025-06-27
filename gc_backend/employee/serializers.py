from rest_framework import serializers
from accounts.models import CustomUser as User
from .models import ChatMessage, ChatSummary

class EmployeeSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'post', 'phone', 'department', 'profile_pic', 'role']


# Chat Messages
class ChatMessageUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'profile_pic']

class ChatMessageSerializer(serializers.ModelSerializer):
    user = ChatMessageUserSerializer(read_only=True)
    
    class Meta:
        model = ChatMessage
        fields = ['id', 'user', 'direction', 'message', 'timestamp']
        ordering = ['timestamp']  # Ensure messages are ordered by timestamp

# Chat Summary
class ChatSummarySerializer(serializers.ModelSerializer):
    user = ChatMessageUserSerializer(read_only=True)
    
    class Meta:
        model = ChatSummary
        fields = ['id', 'user', 'summary_data', 'created_at', 'updated_at']
