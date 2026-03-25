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


@celery_app.task
def send_daily_briefing(user_id: str = None):
    """Proactive Daily Morning Briefing sent via WhatsApp/Telegram."""
    asyncio.get_event_loop().run_until_complete(_send_daily_briefing_async(user_id))

async def _send_daily_briefing_async(user_id: str = None):
    from app.database import AsyncSessionLocal
    from app.models import User, AITask, IntentType, TaskStatus
    from app.ai.intent import execute_with_ai
    from sqlalchemy import select, func
    from datetime import datetime, timedelta, timezone

    now = datetime.now(timezone.utc)
    yesterday_date = now - timedelta(days=1)

    async with AsyncSessionLocal() as db:
        query = select(User).where(User.is_active == True)
        if user_id:
            query = query.where(User.id == user_id)
            
        users = (await db.execute(query)).scalars().all()

        for user in users:
            try:
                if not user.whatsapp_number and not user.telegram_chat_id:
                    continue
                
                # Fetch pending commitments
                result_commitments = await db.execute(
                    select(AITask).where(
                        AITask.user_id == user.id,
                        AITask.intent == IntentType.COMMITMENT_CAPTURE,
                        AITask.status == TaskStatus.PENDING
                    ).order_by(AITask.created_at.desc()).limit(10)
                )
                commitments = result_commitments.scalars().all()
                commits_text = "\n".join([f"- {c.result_data.get('entities', {}).get('client_name', 'Team')}: {c.input_text}" for c in commitments])
                if not commits_text:
                    commits_text = "No pending commitments."

                # Fetch yesterday's tasks completed (Utility/Praise mechanism)
                result_yesterday = await db.execute(
                    select(func.count()).select_from(AITask).where(
                        AITask.user_id == user.id,
                        AITask.created_at >= yesterday_date
                    )
                )
                tasks_yesterday = result_yesterday.scalar() or 0

                briefing_sys = f"""You are Vaani, a proactive Chief of Staff.
It is morning. Write a short WhatsApp morning briefing for {user.name or 'the founder'}.
Always be very warm, precise, and professional.

Context to use:
- Yesterday they executed {tasks_yesterday} operations with you. If > 5, praise them heavily. If 0, gently offer your services (e.g. drafting emails, logging expenses).
- Pending Commitments Today:
{commits_text}

Rules:
1. Keep it under 100 words. Use bullet points for readability.
2. If there are >3 commitments, add exactly this line at the end: "If you are overwhelmed today, just reply *Push all* and I will automatically reschedule these to tomorrow."
3. Respond in their preferred language ({user.language_pref or 'en'}), mixing professional Hindi and English naturally if appropriate."""

                ai_result = await execute_with_ai(
                    instruction="Draft my proactive morning briefing now based on my system context.",
                    context={"user_context": {"name": user.name, "business_name": user.business_name}, "language": user.language_pref or "en"},
                    user_plan=getattr(getattr(user, "subscription", None), "plan", "starter")
                )

                final_msg = ai_result.get("output", "Good morning! Ready to optimize your day.")
                
                # Send Native Payload
                if user.whatsapp_number:
                    from app.bot.whatsapp import send_text_message as wa_send
                    await wa_send(user.whatsapp_number, final_msg)
                elif user.telegram_chat_id:
                    from app.bot.telegram import send_telegram_message as tg_send
                    await tg_send(user.telegram_chat_id, final_msg)

            except Exception as e:
                log.error("daily_briefing.error", user=str(user.id), error=str(e))

