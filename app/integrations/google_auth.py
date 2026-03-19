"""
Google OAuth token refresh.
Google access tokens expire after 1 hour. This refreshes them automatically
before any Google API call so Calendar / Gmail / Tasks never break mid-session.
"""

from datetime import datetime, timezone, timedelta
from typing import Optional

import httpx
import structlog
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.config import settings

log = structlog.get_logger(__name__)


async def get_valid_google_token(
    user_id: str,
    db: AsyncSession,
    integration_name: str = "google_calendar",
) -> Optional[str]:
    """
    Return a valid Google access token, refreshing if expired or expiring soon.
    Call this before every Google API request instead of reading the token directly.
    """
    from app.models import UserIntegration, IntegrationName

    result = await db.execute(
        select(UserIntegration).where(
            UserIntegration.user_id == user_id,
            UserIntegration.integration == IntegrationName(integration_name),
            UserIntegration.is_active == True,
        )
    )
    intg = result.scalar_one_or_none()
    if not intg:
        return None

    # Refresh if token expires within 5 minutes
    needs_refresh = (
        not intg.token_expires_at
        or intg.token_expires_at <= datetime.now(timezone.utc) + timedelta(minutes=5)
    )

    if needs_refresh and intg.refresh_token:
        new_token = await _refresh_google_token(intg.refresh_token)
        if new_token:
            intg.access_token = new_token["access_token"]
            intg.token_expires_at = datetime.now(timezone.utc) + timedelta(
                seconds=new_token.get("expires_in", 3600)
            )
            # Also update sibling integration (Gmail shares token with Calendar)
            sibling = "gmail" if integration_name == "google_calendar" else "google_calendar"
            result2 = await db.execute(
                select(UserIntegration).where(
                    UserIntegration.user_id == user_id,
                    UserIntegration.integration == IntegrationName(sibling),
                )
            )
            sib = result2.scalar_one_or_none()
            if sib:
                sib.access_token = new_token["access_token"]
                sib.token_expires_at = intg.token_expires_at
            await db.flush()
            log.info("google_token.refreshed", user_id=user_id)
            return new_token["access_token"]
        else:
            # Refresh failed — mark integration inactive so user gets re-auth prompt
            intg.is_active = False
            await db.flush()
            log.warning("google_token.refresh_failed", user_id=user_id)
            return None

    return intg.access_token


async def _refresh_google_token(refresh_token: str) -> Optional[dict]:
    """Call Google token endpoint to get a new access token."""
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            resp = await client.post(
                "https://oauth2.googleapis.com/token",
                data={
                    "client_id": settings.GOOGLE_CLIENT_ID,
                    "client_secret": settings.GOOGLE_CLIENT_SECRET,
                    "refresh_token": refresh_token,
                    "grant_type": "refresh_token",
                },
            )
            if resp.status_code == 200:
                return resp.json()
            log.error("google_refresh.failed", status=resp.status_code, body=resp.text[:200])
            return None
        except Exception as e:
            log.error("google_refresh.error", error=str(e))
            return None
