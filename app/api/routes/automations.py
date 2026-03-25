"""Automations API routes."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from pydantic import BaseModel
from typing import Optional
from app.database import get_db
from app.api.routes.dashboard import get_current_user
from app.models import Automation, AutomationTrigger
import secrets

router = APIRouter()

class AutomationCreate(BaseModel):
    name: str
    instruction: str
    trigger_type: str = "recurring"
    cron_expression: Optional[str] = None  # e.g. "0 9 * * 1" = every Monday 9am

@router.get("/")
async def list_automations(user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Automation).where(Automation.user_id == user.id).order_by(desc(Automation.created_at))
    )
    return [
        {
            "id": str(a.id), "name": a.name, "instruction": a.instruction,
            "trigger_type": a.trigger_type.value, "cron_expression": a.cron_expression,
            "is_active": a.is_active, "run_count": a.run_count,
            "last_run_at": a.last_run_at.isoformat() if a.last_run_at else None,
            "webhook_url": f"/api/webhook/automation/{user.id}/{a.id}" if a.trigger_type == AutomationTrigger.WEBHOOK else None,
        }
        for a in result.scalars().all()
    ]

@router.post("/", status_code=201)
async def create_automation(body: AutomationCreate, user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    from app.models import Subscription, PlanTier
    result = await db.execute(select(Subscription).where(Subscription.user_id == user.id))
    sub = result.scalar_one_or_none()
    if sub and sub.plan == PlanTier.STARTER:
        raise HTTPException(status_code=403, detail="Automations require Growth or Pro plan")

    auto = Automation(
        user_id=user.id, name=body.name, instruction=body.instruction,
        trigger_type=AutomationTrigger(body.trigger_type),
        cron_expression=body.cron_expression,
        webhook_secret=secrets.token_urlsafe(16),
    )
    db.add(auto)
    await db.flush()
    return {"id": str(auto.id), "name": auto.name, "webhook_secret": auto.webhook_secret}

@router.delete("/{automation_id}")
async def delete_automation(automation_id: str, user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Automation).where(Automation.id == automation_id, Automation.user_id == user.id))
    auto = result.scalar_one_or_none()
    if not auto:
        raise HTTPException(status_code=404)
    await db.delete(auto)
    return {"status": "deleted"}

@router.post("/trigger-briefing")
async def trigger_daily_briefing(user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """Manually invoke the Proactive Morning Briefing for live demos (FastAPI Background Task)."""
    from app.tasks.automation_tasks import _send_daily_briefing_async
    import asyncio
    asyncio.create_task(_send_daily_briefing_async(str(user.id)))
    return {"status": "Briefing triggered and routing to your phone"}
