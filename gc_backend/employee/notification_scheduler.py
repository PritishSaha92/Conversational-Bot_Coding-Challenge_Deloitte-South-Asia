from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from django.utils import timezone
from datasets.models import TablesEmployee
from .notification_views import should_send_notification, create_notification

def send_notifications():
    """Send notifications to eligible employees at 10 AM."""
    employees = TablesEmployee.objects.filter(is_alerted=False)
    for employee in employees:
        if should_send_notification(employee):
            create_notification(employee)

def start():
    scheduler = BackgroundScheduler()
    scheduler.add_job(
        send_notifications,
        trigger=CronTrigger(hour=10, minute=0),  # Run at 10 AM every day
        id='send_notifications',
        max_instances=1,
        replace_existing=True
    )
    scheduler.start() 