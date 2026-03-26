#!/bin/bash
# Start Celery Beat scheduler (morning briefing, compliance reminders)
celery -A app.tasks.celery_app beat --loglevel=info --detach

# Start Celery Worker (background task processor)
celery -A app.tasks.celery_app worker --loglevel=info -Q default --detach

# Start the main API server (foreground — keeps container alive)
exec uvicorn app.main:app --host 0.0.0.0 --port $PORT
