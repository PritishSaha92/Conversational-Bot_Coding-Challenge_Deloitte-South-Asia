from django.db.models.signals import post_save
from django.dispatch import receiver
from accounts.models import CustomUser
from employee.models import EmployeeProfile

@receiver(post_save, sender=CustomUser)
def create_employee_profile(sender, instance, created, **kwargs):
    if created and instance.role == 'employee':
        # Only create if not already created
        EmployeeProfile.objects.get_or_create(user=instance, defaults={
            'department': instance.department or "Unknown"
        })
