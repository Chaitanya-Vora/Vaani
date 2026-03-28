"""
Webhook routes — WhatsApp and Telegram message ingestion.
"""

from fastapi import APIRouter, Request, Response, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
import structlog

from app.database import get_db
from app.bot.whatsapp import verify_webhook, parse_whatsapp_message
from app.bot.telegram import parse_telegram_update
from app.bot.message_router import route_whatsapp_message, route_telegram_message

router = APIRouter()
log = structlog.get_logger(__name__)


@router.get("/whatsapp")
async def whatsapp_verify(
    hub_mode: str = None,
    hub_verify_token: str = None,
    hub_challenge: str = None,
):
    """Meta webhook verification handshake."""
    # FastAPI doesn't auto-parse query params with dots in param names
    challenge = verify_webhook(hub_mode, hub_verify_token, hub_challenge)
    if challenge:
        return Response(content=challenge, media_type="text/plain")
    raise HTTPException(status_code=403, detail="Invalid verify token")


@router.post("/whatsapp")
async def whatsapp_incoming(
    request: Request,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    """Receive WhatsApp messages from Meta Cloud API."""
    payload = await request.json()

    # Parse message
    parsed = parse_whatsapp_message(payload)
    if parsed:
        background_tasks.add_task(route_whatsapp_message, parsed, db)

    # Always return 200 quickly — Meta will retry if we return non-200
    return {"status": "ok"}


@router.post("/telegram")
async def telegram_incoming(
    request: Request,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    """Receive Telegram updates with synchronous heartbeat for reliability."""
    try:
        payload = await request.json()
        parsed = parse_telegram_update(payload)
        
        if parsed and parsed.get("telegram_chat_id"):
            chat_id = parsed["telegram_chat_id"]
            # ── SYNCHRONOUS HEARTBEAT ──
            # This confirms the server is REACHABLE regardless of DB/AI state
            from app.bot.telegram import send_telegram_message as tg_send
            await tg_send(chat_id, "⚡ _Vaani Operational Hub: Message Received. Processing..._")
            
            # Now proceed with heavy AI routing in the background
            background_tasks.add_task(route_telegram_message, parsed, db)
        
        return {"status": "ok"}
    except Exception as e:
        log.error("telegram.webhook_error", error=str(e))
        return {"status": "ok"} # Always 200 to Telegram


@router.post("/automation/{user_id}/{automation_id}")
async def webhook_automation_trigger(
    user_id: str,
    automation_id: str,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """Trigger a user's webhook automation."""
    from app.models import Automation
    from sqlalchemy import select

    result = await db.execute(
        select(Automation).where(
            Automation.id == automation_id,
            Automation.user_id == user_id,
            Automation.is_active == True,
        )
    )
    automation = result.scalar_one_or_none()
    if not automation:
        raise HTTPException(status_code=404, detail="Automation not found")

    # Verify webhook secret
    incoming_secret = request.headers.get("X-Vaani-Secret", "")
    if automation.webhook_secret and incoming_secret != automation.webhook_secret:
        raise HTTPException(status_code=401, detail="Invalid webhook secret")

    payload = await request.json()
    from app.tasks.automation_tasks import trigger_webhook_automation
    trigger_webhook_automation.delay(automation_id, payload)

    return {"status": "triggered", "automation": automation.name}
