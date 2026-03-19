"""Billing routes — Razorpay subscription management."""
from fastapi import APIRouter, Depends, Request, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.api.routes.dashboard import get_current_user

router = APIRouter()

@router.post("/subscribe/{plan}")
async def start_subscription(plan: str, user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if plan not in ("starter", "growth", "pro"):
        raise HTTPException(status_code=400, detail="Invalid plan")
    from app.billing.razorpay_billing import create_razorpay_subscription
    result = await create_razorpay_subscription(str(user.id), plan)
    return result

@router.post("/webhook/razorpay")
async def razorpay_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    payload = await request.body()
    signature = request.headers.get("X-Razorpay-Signature", "")
    from app.billing.razorpay_billing import verify_razorpay_webhook, handle_razorpay_event
    if not verify_razorpay_webhook(payload, signature):
        raise HTTPException(status_code=400, detail="Invalid signature")
    event = await request.json()
    await handle_razorpay_event(event, db)
    return {"status": "ok"}

@router.get("/plans")
async def get_plans():
    return {
        "plans": [
            {"id": "starter", "name": "Starter", "price_inr": 299, "tasks": 50,
             "features": ["WhatsApp + Telegram", "Voice notes → Notion", "GST deadline alerts", "50 tasks/month"]},
            {"id": "growth", "name": "Growth", "price_inr": 799, "tasks": 200,
             "features": ["Everything in Starter", "GST invoice generator", "CRM + automations", "200 tasks/month", "3 team members"]},
            {"id": "pro", "name": "Pro / CA & AIF", "price_inr": 2499, "tasks": -1,
             "features": ["Everything in Growth", "SEBI/AIF compliance", "Unlimited tasks", "10 team members", "Priority support"]},
        ]
    }
