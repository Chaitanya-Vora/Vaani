"""Health check."""
from fastapi import APIRouter
from datetime import datetime, timezone
import httpx
from app.config import settings

router = APIRouter()

@router.get("/health")
async def health():
    """Diagnostic heartbeat for executive backend."""
    from app.database import engine, get_redis
    from sqlalchemy import text
    
    db_status = "error"
    redis_status = "error"
    
    # 1. Check DB
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
            db_status = "connected"
    except Exception as e:
        db_status = f"failed: {str(e)}"

    # 2. Check Redis
    try:
        redis = await get_redis()
        await redis.ping()
        redis_status = "connected"
    except Exception as e:
        redis_status = f"failed: {str(e)}"

    return {
        "status": "ok" if db_status == "connected" and redis_status == "connected" else "degraded",
        "service": "vaani-api",
        "database": db_status,
        "redis": redis_status,
        "env": settings.ENV,
        "ts": datetime.now(timezone.utc).isoformat()
    }

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
