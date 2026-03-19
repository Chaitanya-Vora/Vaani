"""
Observer Tasks — active persistence monitoring.
"""

import asyncio
from typing import Optional
import structlog
from datetime import datetime, date

from app.tasks.celery_app import celery_app

log = structlog.get_logger(__name__)


@celery_app.task
def check_gmail_for_commitments(user_id: str, deadline: str, intent_data: dict):
    """
    Check if the user actually sent the promised email.
    If not, send a WhatsApp nudge.
    For V1, Stick to polling, but suggest BCC routing.
    """
    asyncio.get_event_loop().run_until_complete(
        _check_gmail_async(user_id, deadline, intent_data)
    )

async def _check_gmail_async(user_id: str, deadline: str, intent_data: dict):
    from app.database import AsyncSessionLocal
    from app.models import User
    from app.bot.whatsapp import send_text_message
    
    async with AsyncSessionLocal() as db:
        user = await db.get(User, user_id)
        if not user or not user.whatsapp_number:
            return

        # V1: Mock polling logic + nudge
        # Assume the email wasn't sent yet
        msg = f"Boss, {deadline} ho gaye. Quote/Email nahi gaya lagta hai. Should I draft it using templates in Notion?\n\n_Pro-Tip: BCC vaani+{user.id}@vaani.app so I know instantly when it's sent!_"
        
        await send_text_message(user.whatsapp_number, msg)
        log.info("observer.commitment_nudge_sent", user_id=str(user.id))


@celery_app.task
def debtor_watcher():
    """
    Daily cron at 9:00 AM.
    Filters invoices where status == 'Unpaid' and due_date < today.
    Sends "Daily Cash Summary" list with [NUDGE] buttons for each debtor.
    """
    asyncio.get_event_loop().run_until_complete(_debtor_watcher_async())

async def _debtor_watcher_async():
    from app.database import AsyncSessionLocal
    from app.models import User
    from app.bot.whatsapp import send_text_message
    
    async with AsyncSessionLocal() as db:
        # Mock logic representing querying the Notion/Tally DB
        # Send interactive message
        log.info("observer.debtor_watcher_running")
        
        # Note on WhatsApp Templates:
        # WhatsApp templates for the [NUDGE] buttons MUST be pre-approved via Meta Business Manager.
        # We would invoke the interactive templates API via `send_template_message(template="cash_summary_nudge_v1")`
