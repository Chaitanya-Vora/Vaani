"""
Celery background tasks — reminders, compliance alerts, automation runs, billing resets.
"""

from celery import Celery
from celery.schedules import crontab

from app.config import settings

celery_app = Celery(
    "vaani",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
    include=[
        "app.tasks.reminder_tasks",
        "app.tasks.automation_tasks",
        "app.tasks.billing_tasks",
    ],
)

celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="Asia/Kolkata",
    enable_utc=True,
    task_track_started=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,   # fair distribution
    task_soft_time_limit=120,       # 2 min
    task_time_limit=180,            # 3 min hard kill

    beat_schedule={
        # Run compliance reminder check every day at 9:00 AM IST
        "compliance-reminders-daily": {
            "task": "app.tasks.reminder_tasks.send_compliance_reminders",
            "schedule": crontab(hour=9, minute=0),
        },
        # Send personal reminders every 5 minutes (for set_reminder intent)
        "personal-reminders-poll": {
            "task": "app.tasks.reminder_tasks.send_pending_personal_reminders",
            "schedule": crontab(minute="*/5"),
        },
        # Reset monthly usage counters at midnight on 1st of each month
        "reset-monthly-usage": {
            "task": "app.tasks.billing_tasks.reset_monthly_usage",
            "schedule": crontab(hour=0, minute=0, day_of_month=1),
        },
        # Run recurring automations every 30 minutes
        "run-automations": {
            "task": "app.tasks.automation_tasks.run_due_automations",
            "schedule": crontab(minute="*/30"),
        },
        # Festival reminder seeder — weekly on Monday 8 AM
        "festival-reminders": {
            "task": "app.tasks.reminder_tasks.send_festival_reminders",
            "schedule": crontab(hour=8, minute=0, day_of_week=1),
        },
    },
)
