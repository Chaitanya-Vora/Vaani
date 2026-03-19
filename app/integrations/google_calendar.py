"""Google Calendar & Tasks integration."""
import httpx
from typing import Optional
import structlog
log = structlog.get_logger(__name__)

GCAL_BASE = "https://www.googleapis.com/calendar/v3"
GTASK_BASE = "https://tasks.googleapis.com/tasks/v1"

async def create_task(access_token: str, title: str, due_date: Optional[str] = None, notes: Optional[str] = None) -> Optional[str]:
    body = {"title": title, "status": "needsAction"}
    if due_date:
        body["due"] = f"{due_date}T00:00:00.000Z"
    if notes:
        body["notes"] = notes
    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.post(
            f"{GTASK_BASE}/lists/@default/tasks",
            headers={"Authorization": f"Bearer {access_token}"},
            json=body,
        )
        if resp.status_code in (200, 201):
            return resp.json().get("id")
    return None

async def create_calendar_event(access_token: str, title: str, start: str, end: str, description: str = "") -> Optional[str]:
    body = {
        "summary": title, "description": description,
        "start": {"dateTime": start, "timeZone": "Asia/Kolkata"},
        "end": {"dateTime": end, "timeZone": "Asia/Kolkata"},
    }
    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.post(
            f"{GCAL_BASE}/calendars/primary/events",
            headers={"Authorization": f"Bearer {access_token}"},
            json=body,
        )
        if resp.status_code in (200, 201):
            return resp.json().get("htmlLink")
    return None
