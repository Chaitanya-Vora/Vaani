"""Health check."""
from fastapi import APIRouter
from datetime import datetime, timezone
import httpx
from app.config import settings

router = APIRouter()

@router.get("/health")
async def health():
    return {"status": "ok", "service": "vaani-api", "ts": datetime.now(timezone.utc).isoformat()}

@router.get("/telegram")
async def telegram_health():
    """Verify Telegram Bot API connectivity and webhook status."""
    token = settings.TELEGRAM_BOT_TOKEN
    if not token:
        return {"status": "error", "message": "TELEGRAM_BOT_TOKEN not configured"}
    
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.get(f"https://api.telegram.org/bot{token}/getWebhookInfo", timeout=5.0)
            data = resp.json()
            if data.get("ok"):
                return {
                    "status": "connected",
                    "webhook_info": data["result"],
                    "ts": datetime.now(timezone.utc).isoformat()
                }
            return {"status": "error", "telegram_error": data}
        except Exception as e:
            return {"status": "exception", "error": str(e)}
