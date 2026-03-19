"""
Celery reminder tasks — compliance alerts, personal reminders, festival greetings.
"""

import asyncio
from datetime import datetime, timezone, timedelta, date
from typing import Optional

import structlog
from celery import shared_task
from sqlalchemy import select, and_

from app.tasks.celery_app import celery_app

log = structlog.get_logger(__name__)


@celery_app.task(bind=True, max_retries=3)
def schedule_reminder(
    self,
    user_id: str,
    message: str,
    remind_at: str,              # ISO date string
    channel: str = "whatsapp",
) -> str:
    """Schedule a personal reminder for a user."""
    from app.database import AsyncSessionLocal
    import asyncio

    async def _run():
        async with AsyncSessionLocal() as db:
            from app.models import User, ComplianceReminder

            # Parse remind_at
            try:
                remind_dt = datetime.fromisoformat(remind_at)
            except ValueError:
                # Try to parse natural date like "2024-11-18"
                remind_dt = datetime.strptime(remind_at, "%Y-%m-%d")
                remind_dt = remind_dt.replace(hour=9, minute=0)  # default 9 AM

            # Store as compliance reminder for tracking
            from app.models import ComplianceReminder
            reminder = ComplianceReminder(
                user_id=user_id,
                compliance_type="personal_reminder",
                due_date=remind_dt,
                description=message,
                period="personal",
            )
            db.add(reminder)
            await db.commit()

            log.info("reminder.scheduled", user_id=user_id, remind_at=remind_at)
            return reminder.id

    return asyncio.get_event_loop().run_until_complete(_run())


@celery_app.task
def send_compliance_reminders():
    """
    Daily job: Send WhatsApp compliance reminders.
    Sends 3-day warning, 1-day warning, and day-of reminder.
    """
    asyncio.get_event_loop().run_until_complete(_send_compliance_reminders_async())


async def _send_compliance_reminders_async():
    from app.database import AsyncSessionLocal
    from app.models import ComplianceReminder, User, Subscription, PlanStatus
    from app.bot.whatsapp import send_compliance_alert
    from app.bot.telegram import send_telegram_message

    today = date.today()
    remind_days = [0, 1, 3]   # same day, 1 day before, 3 days before

    async with AsyncSessionLocal() as db:
        for days_before in remind_days:
            target_date = today + timedelta(days=days_before)

            # Get all pending reminders due on target_date
            result = await db.execute(
                select(ComplianceReminder, User, Subscription)
                .join(User, ComplianceReminder.user_id == User.id)
                .join(Subscription, User.id == Subscription.user_id)
                .where(
                    and_(
                        ComplianceReminder.due_date >= datetime.combine(target_date, datetime.min.time()),
                        ComplianceReminder.due_date < datetime.combine(target_date + timedelta(days=1), datetime.min.time()),
                        ComplianceReminder.is_completed == False,
                        Subscription.status.in_(["active", "trial"]),
                    )
                )
            )
            rows = result.all()

            sent_count = 0
            for reminder, user, sub in rows:
                # Check if we already sent this reminder level
                if days_before == 3 and reminder.reminder_sent_3d:
                    continue
                if days_before == 1 and reminder.reminder_sent_1d:
                    continue
                if days_before == 0 and reminder.reminder_sent_day:
                    continue

                # Skip personal reminders in compliance loop
                if reminder.compliance_type == "personal_reminder":
                    continue

                # Send via WhatsApp or Telegram
                due_date_str = reminder.due_date.strftime("%d %b %Y")
                sent = False

                if user.whatsapp_number:
                    sent = await send_compliance_alert(
                        to=user.whatsapp_number,
                        compliance_type=reminder.description[:50],
                        due_date=due_date_str,
                        days_remaining=days_before,
                    )
                elif user.telegram_chat_id:
                    from app.compliance.india_calendar import get_upcoming_deadlines_text
                    msg = f"⚠️ *Compliance Alert*\n\n*{reminder.description[:100]}*\nDue: {due_date_str}"
                    sent = await send_telegram_message(user.telegram_chat_id, msg)

                if sent:
                    if days_before == 3:
                        reminder.reminder_sent_3d = True
                    elif days_before == 1:
                        reminder.reminder_sent_1d = True
                    elif days_before == 0:
                        reminder.reminder_sent_day = True
                    sent_count += 1

            await db.commit()
            log.info("compliance_reminders.sent", days_before=days_before, count=sent_count)


@celery_app.task
def send_pending_personal_reminders():
    """Every 5 minutes: check for personal reminders that are due."""
    asyncio.get_event_loop().run_until_complete(_send_personal_reminders_async())


async def _send_personal_reminders_async():
    from app.database import AsyncSessionLocal
    from app.models import ComplianceReminder, User
    from app.bot.whatsapp import send_text_message
    from app.bot.telegram import send_telegram_message

    now = datetime.now(timezone.utc)
    window_end = now + timedelta(minutes=5)

    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(ComplianceReminder, User)
            .join(User, ComplianceReminder.user_id == User.id)
            .where(
                and_(
                    ComplianceReminder.compliance_type == "personal_reminder",
                    ComplianceReminder.due_date >= now,
                    ComplianceReminder.due_date <= window_end,
                    ComplianceReminder.is_completed == False,
                    ComplianceReminder.reminder_sent_day == False,
                )
            )
        )
        rows = result.all()

        for reminder, user in rows:
            msg = f"⏰ *Reminder*\n\n{reminder.description}"
            sent = False

            if user.whatsapp_number:
                sent = await send_text_message(user.whatsapp_number, msg)
            elif user.telegram_chat_id:
                sent = await send_telegram_message(user.telegram_chat_id, msg)

            if sent:
                reminder.reminder_sent_day = True
                reminder.is_completed = True
                log.info("personal_reminder.sent", user_id=str(user.id))

        await db.commit()


# ── Indian Festival Reminders ─────────────────────────────────────────────────

INDIAN_FESTIVALS_2025 = {
    "2025-01-14": "Makar Sankranti",
    "2025-01-26": "Republic Day",
    "2025-03-14": "Holi",
    "2025-03-30": "Ram Navami",
    "2025-04-14": "Baisakhi / Dr. Ambedkar Jayanti",
    "2025-04-18": "Good Friday",
    "2025-05-12": "Buddha Purnima",
    "2025-08-15": "Independence Day",
    "2025-08-16": "Janmashtami",
    "2025-09-05": "Ganesh Chaturthi",
    "2025-10-02": "Gandhi Jayanti",
    "2025-10-20": "Dussehra",
    "2025-10-31": "Halloween (for tech/startup clients)",
    "2025-11-01": "Diwali",
    "2025-11-05": "Bhai Dooj",
    "2025-12-25": "Christmas",
    "2025-12-31": "New Year Eve",
}


@celery_app.task
def send_festival_reminders():
    """
    Weekly job: Alert users to wish clients for upcoming festivals.
    Only for Growth/Pro users with CRM enabled.
    """
    asyncio.get_event_loop().run_until_complete(_send_festival_reminders_async())


async def _send_festival_reminders_async():
    from app.database import AsyncSessionLocal
    from app.models import User, Subscription, PlanTier
    from app.bot.whatsapp import send_text_message
    from datetime import datetime

    today = date.today()
    upcoming_festivals = []

    for date_str, festival_name in INDIAN_FESTIVALS_2025.items():
        festival_date = datetime.strptime(date_str, "%Y-%m-%d").date()
        days_until = (festival_date - today).days
        if 0 < days_until <= 7:
            upcoming_festivals.append((festival_date, festival_name, days_until))

    if not upcoming_festivals:
        return

    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(User, Subscription)
            .join(Subscription, User.id == Subscription.user_id)
            .where(
                and_(
                    Subscription.plan.in_([PlanTier.GROWTH, PlanTier.PRO]),
                    Subscription.status.in_(["active", "trial"]),
                    User.whatsapp_number.isnot(None),
                )
            )
        )
        users = result.all()

        for user, sub in users:
            for festival_date, festival_name, days_until in upcoming_festivals:
                timing = "tomorrow" if days_until == 1 else f"in {days_until} days"
                msg = (
                    f"🎉 *{festival_name}* is {timing} ({festival_date.strftime('%d %b')})!\n\n"
                    f"Would you like me to draft WhatsApp greetings for your clients?\n\n"
                    f"Reply *YES* and I'll draft personalized messages for all your active clients."
                )
                await send_text_message(user.whatsapp_number, msg)

        log.info("festival_reminders.sent", festivals=len(upcoming_festivals), users=len(users))
