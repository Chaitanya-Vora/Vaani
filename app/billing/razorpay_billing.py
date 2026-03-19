"""
Billing tasks and Razorpay integration — Indian payment infrastructure.
"""

import asyncio
import hmac
import hashlib
import json
from datetime import datetime, timezone, timedelta

import razorpay
import structlog
from app.tasks.celery_app import celery_app
from app.config import settings

log = structlog.get_logger(__name__)

rz_client = razorpay.Client(
    auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET)
)

PLAN_AMOUNTS = {
    "starter": settings.PLAN_STARTER_PRICE * 100,   # paise
    "growth": settings.PLAN_GROWTH_PRICE * 100,
    "pro": settings.PLAN_PRO_PRICE * 100,
}


# ── Subscription management ───────────────────────────────────────────────────

async def create_razorpay_subscription(user_id: str, plan: str) -> dict:
    """Create a Razorpay subscription for a user."""
    plan_id = await _get_or_create_plan(plan)

    subscription = rz_client.subscription.create({
        "plan_id": plan_id,
        "customer_notify": 1,
        "total_count": 12,
        "quantity": 1,
        "notes": {"user_id": user_id, "plan": plan},
    })

    return {
        "subscription_id": subscription["id"],
        "short_url": subscription.get("short_url"),
    }


async def _get_or_create_plan(plan: str) -> str:
    """Get Razorpay plan ID, create if doesn't exist."""
    plan_names = {
        "starter": "Vaani Starter",
        "growth": "Vaani Growth",
        "pro": "Vaani Pro",
    }
    amount = PLAN_AMOUNTS.get(plan)
    if not amount:
        raise ValueError(f"Unknown plan: {plan}")

    plans = rz_client.plan.all({"count": 50})
    for p in plans.get("items", []):
        if p.get("item", {}).get("name") == plan_names[plan]:
            return p["id"]

    new_plan = rz_client.plan.create({
        "period": "monthly",
        "interval": 1,
        "item": {
            "name": plan_names[plan],
            "amount": amount,
            "currency": "INR",
            "description": f"Vaani {plan.title()} Plan — AI Business Assistant",
        },
    })
    return new_plan["id"]


def verify_razorpay_webhook(payload: bytes, signature: str) -> bool:
    """Verify Razorpay webhook signature."""
    expected = hmac.new(
        settings.RAZORPAY_WEBHOOK_SECRET.encode(),
        payload,
        hashlib.sha256,
    ).hexdigest()
    return hmac.compare_digest(expected, signature)


async def handle_razorpay_event(event: dict, db):
    """Process Razorpay webhook event."""
    from app.models import Subscription, PlanTier, PlanStatus, User
    from sqlalchemy import select

    event_type = event.get("event")
    payload = event.get("payload", {})

    log.info("razorpay.event", event_type=event_type)

    if event_type == "subscription.activated":
        sub_data = payload.get("subscription", {}).get("entity", {})
        sub_id = sub_data.get("id")
        user_id = sub_data.get("notes", {}).get("user_id")
        plan_str = sub_data.get("notes", {}).get("plan", "starter")

        if user_id:
            result = await db.execute(
                select(Subscription).where(Subscription.user_id == user_id)
            )
            sub = result.scalar_one_or_none()
            if sub:
                sub.status = PlanStatus.ACTIVE
                sub.plan = PlanTier(plan_str)
                sub.razorpay_subscription_id = sub_id
                sub.current_period_start = datetime.now(timezone.utc)
                sub.current_period_end = datetime.now(timezone.utc) + timedelta(days=30)
                await db.flush()
                log.info("subscription.activated", user_id=user_id, plan=plan_str)

    elif event_type == "subscription.cancelled":
        sub_data = payload.get("subscription", {}).get("entity", {})
        user_id = sub_data.get("notes", {}).get("user_id")
        if user_id:
            result = await db.execute(
                select(Subscription).where(Subscription.user_id == user_id)
            )
            sub = result.scalar_one_or_none()
            if sub:
                sub.status = PlanStatus.CANCELLED
                await db.flush()

    elif event_type == "subscription.charged":
        sub_data = payload.get("subscription", {}).get("entity", {})
        user_id = sub_data.get("notes", {}).get("user_id")
        if user_id:
            result = await db.execute(
                select(Subscription).where(Subscription.user_id == user_id)
            )
            sub = result.scalar_one_or_none()
            if sub:
                sub.status = PlanStatus.ACTIVE
                sub.current_period_start = datetime.now(timezone.utc)
                sub.current_period_end = datetime.now(timezone.utc) + timedelta(days=30)
                await db.flush()


@celery_app.task
def reset_monthly_usage():
    """Reset usage counters on 1st of each month."""
    asyncio.get_event_loop().run_until_complete(_reset_usage_async())


async def _reset_usage_async():
    from app.database import AsyncSessionLocal
    from app.models import Subscription
    from sqlalchemy import update

    async with AsyncSessionLocal() as db:
        await db.execute(
            update(Subscription).values(tasks_used_this_month=0)
        )
        await db.commit()
        log.info("monthly_usage.reset")
