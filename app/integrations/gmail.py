"""Gmail integration stub."""
import httpx
from typing import Optional
import base64, structlog
log = structlog.get_logger(__name__)

async def send_email(access_token: str, to: str, subject: str, body: str) -> bool:
    message = f"To: {to}\r\nSubject: {subject}\r\nContent-Type: text/plain; charset=utf-8\r\n\r\n{body}"
    raw = base64.urlsafe_b64encode(message.encode()).decode()
    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.post(
            "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
            headers={"Authorization": f"Bearer {access_token}"},
            json={"raw": raw},
        )
        return resp.status_code in (200, 201)
