"""
Automation runner — executes recurring and webhook-triggered automations.
"""

import asyncio
from datetime import datetime, timezone
from croniter import croniter

import structlog
from app.tasks.celery_app import celery_app

log = structlog.get_logger(__name__)


@celery_app.task
def run_due_automations():
    """Every 30 min: run all automations whose cron schedule is due."""
    asyncio.get_event_loop().run_until_complete(_run_automations_async())


async def _run_automations_async():
    from app.database import AsyncSessionLocal
    from app.models import Automation, User, AutomationTrigger
    from app.ai.intent import execute_with_ai
    from app.bot.whatsapp import send_text_message
    from sqlalchemy import select

    now = datetime.now(timezone.utc)

    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(Automation, User)
            .join(User, Automation.user_id == User.id)
            .where(
                Automation.is_active == True,
                Automation.trigger_type == AutomationTrigger.RECURRING,
                Automation.cron_expression.isnot(None),
            )
        )
        automations = result.all()

        for automation, user in automations:
            try:
                cron = croniter(automation.cron_expression, automation.last_run_at or now)
                next_run = cron.get_next(datetime)

                if next_run <= now:
                    # Execute this automation
                    from app.models import PlanTier
                    plan = getattr(getattr(user, "subscription", None), "plan", PlanTier.STARTER)

                    ai_result = await execute_with_ai(
                        instruction=automation.instruction,
                        context={
                            "user_context": {
                                "name": user.name,
                                "business_name": user.business_name,
                            },
                            "language": user.language_pref or "en",
                        },
                        user_plan=plan,
                    )

                    automation.last_run_at = now
                    automation.run_count = (automation.run_count or 0) + 1

                    # Notify user via WhatsApp
                    if user.whatsapp_number:
                        msg = f"🤖 *Automation ran*: _{automation.name}_\n\n{ai_result.get('output', '')[:300]}"
                        await send_text_message(user.whatsapp_number, msg)

                    log.info("automation.executed", automation_id=str(automation.id), user_id=str(user.id))

            except Exception as e:
                automation.error_count = (automation.error_count or 0) + 1
                automation.last_error = str(e)
                log.error("automation.error", automation_id=str(automation.id), error=str(e))

        await db.commit()


@celery_app.task
def trigger_webhook_automation(automation_id: str, payload: dict):
    """Execute a webhook-triggered automation with the incoming payload."""
    asyncio.get_event_loop().run_until_complete(
        _trigger_webhook_async(automation_id, payload)
    )


async def _trigger_webhook_async(automation_id: str, payload: dict):
    from app.database import AsyncSessionLocal
    from app.models import Automation, User
    from app.ai.intent import execute_with_ai
    from app.bot.whatsapp import send_text_message
    from sqlalchemy import select
    import json

    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(Automation, User)
            .join(User, Automation.user_id == User.id)
            .where(Automation.id == automation_id)
        )
        row = result.one_or_none()
        if not row:
            return

        automation, user = row
        if not automation.is_active:
            return

        instruction = f"{automation.instruction}\n\nWebhook payload: {json.dumps(payload, ensure_ascii=False)[:500]}"

        from app.models import PlanTier
        plan = getattr(getattr(user, "subscription", None), "plan", PlanTier.STARTER)

        ai_result = await execute_with_ai(
            instruction=instruction,
            context={"user_context": {"name": user.name, "business_name": user.business_name}, "language": "en"},
            user_plan=plan,
        )

        automation.last_run_at = datetime.now(timezone.utc)
        automation.run_count = (automation.run_count or 0) + 1

        if user.whatsapp_number:
            msg = f"🔗 *Webhook automation*: _{automation.name}_\n\n{ai_result.get('output', '')[:300]}"
            await send_text_message(user.whatsapp_number, msg)

        await db.commit()
