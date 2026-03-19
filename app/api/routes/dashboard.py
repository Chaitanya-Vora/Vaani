"""Dashboard API routes."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timezone, timedelta

from app.database import get_db
from app.api.routes.auth import decode_token
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi import Security
import structlog

router = APIRouter()
log = structlog.get_logger(__name__)
security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Security(security),
    db: AsyncSession = Depends(get_db),
):
    user_id = decode_token(credentials.credentials)
    from app.models import User
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.get("/me")
async def get_me(user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    from app.models import Subscription, UserIntegration
    result = await db.execute(select(Subscription).where(Subscription.user_id == user.id))
    sub = result.scalar_one_or_none()

    result2 = await db.execute(
        select(UserIntegration).where(
            UserIntegration.user_id == user.id,
            UserIntegration.is_active == True,
        )
    )
    integrations = [i.integration.value for i in result2.scalars().all()]

    return {
        "id": str(user.id),
        "name": user.name,
        "email": user.email,
        "business_name": user.business_name,
        "business_type": user.business_type,
        "gstin": user.gstin,
        "whatsapp_number": user.whatsapp_number,
        "language_pref": user.language_pref,
        "plan": sub.plan.value if sub else "starter",
        "plan_status": sub.status.value if sub else "trial",
        "tasks_used": sub.tasks_used_this_month if sub else 0,
        "tasks_limit": {"starter": 50, "growth": 200, "pro": 999999}.get(sub.plan.value if sub else "starter", 50),
        "trial_ends_at": sub.trial_ends_at.isoformat() if sub and sub.trial_ends_at else None,
        "connected_integrations": integrations,
    }


@router.get("/stats")
async def get_stats(user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    from app.models import AITask, Message, Client, Expense, IntentType
    from sqlalchemy import and_

    thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)

    # Task counts by intent
    tasks = await db.execute(
        select(AITask.intent, func.count(AITask.id).label("count"))
        .where(AITask.user_id == user.id, AITask.created_at >= thirty_days_ago)
        .group_by(AITask.intent)
    )
    task_breakdown = {row.intent.value: row.count for row in tasks.all()}

    # Message count
    msg_count = await db.execute(
        select(func.count(Message.id)).where(
            Message.user_id == user.id,
            Message.received_at >= thirty_days_ago,
        )
    )

    # Client count
    client_count = await db.execute(
        select(func.count(Client.id)).where(Client.user_id == user.id)
    )

    # Total expense this month
    expense_sum = await db.execute(
        select(func.sum(Expense.amount_paise)).where(
            Expense.user_id == user.id,
            Expense.expense_date >= thirty_days_ago,
        )
    )

    # Recent tasks
    recent = await db.execute(
        select(AITask).where(AITask.user_id == user.id)
        .order_by(desc(AITask.created_at)).limit(10)
    )

    return {
        "messages_30d": msg_count.scalar() or 0,
        "clients": client_count.scalar() or 0,
        "expense_30d_inr": round((expense_sum.scalar() or 0) / 100, 2),
        "tasks_by_intent": task_breakdown,
        "recent_tasks": [
            {
                "id": str(t.id),
                "intent": t.intent.value,
                "summary": t.output_summary,
                "status": t.status.value,
                "notion_url": t.notion_page_url,
                "created_at": t.created_at.isoformat(),
            }
            for t in recent.scalars().all()
        ],
    }


@router.get("/compliance")
async def get_compliance(user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    from app.models import ComplianceReminder
    from sqlalchemy import and_

    result = await db.execute(
        select(ComplianceReminder)
        .where(
            ComplianceReminder.user_id == user.id,
            ComplianceReminder.is_completed == False,
        )
        .order_by(ComplianceReminder.due_date)
        .limit(30)
    )
    reminders = result.scalars().all()

    today = datetime.now(timezone.utc).date()
    return [
        {
            "id": str(r.id),
            "type": r.compliance_type,
            "description": r.description,
            "due_date": r.due_date.date().isoformat(),
            "period": r.period,
            "days_until": (r.due_date.date() - today).days,
            "is_overdue": r.due_date.date() < today,
        }
        for r in reminders
    ]


@router.get("/commitments")
async def get_commitments(user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    from app.models import AITask, IntentType
    result = await db.execute(
        select(AITask).where(
            AITask.user_id == user.id,
            AITask.intent == IntentType.COMMITMENT_CAPTURE
        ).order_by(desc(AITask.created_at)).limit(50)
    )
    return [
        {
            "id": str(t.id),
            "type": "Commitment",
            "recipient": t.result_data.get("entities", {}).get("client_name", "Team"),
            "desc": t.input_text,
            "due": t.created_at.isoformat(),
            "status": "completed" if t.status.value == "completed" else "active",
        }
        for t in result.scalars().all()
    ]


@router.get("/clients")
async def get_clients(user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    from app.models import Client
    result = await db.execute(
        select(Client).where(Client.user_id == user.id)
        .order_by(desc(Client.last_contacted)).limit(50)
    )
    return [
        {
            "id": str(c.id),
            "name": c.name,
            "company": c.company,
            "phone": c.phone,
            "outstanding_inr": c.outstanding_amount / 100 if c.outstanding_amount else 0,
            "last_contacted": c.last_contacted.isoformat() if c.last_contacted else None,
            "next_followup": c.next_followup.isoformat() if c.next_followup else None,
            "tags": c.tags or [],
        }
        for c in result.scalars().all()
    ]


@router.patch("/me")
async def update_profile(
    body: dict,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    allowed = {"name", "business_name", "gstin", "language_pref", "business_type", "whatsapp_number"}
    for key, value in body.items():
        if key in allowed and hasattr(user, key):
            setattr(user, key, value)
    await db.flush()
    return {"status": "updated"}
