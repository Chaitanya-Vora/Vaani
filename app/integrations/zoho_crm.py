"""Zoho CRM integration stub."""
import httpx
from typing import Optional
import structlog
log = structlog.get_logger(__name__)

ZOHO_BASE = "https://www.zohoapis.in/crm/v2"

async def log_activity(access_token: str, contact_name: str, note: str, follow_up_date: Optional[str] = None) -> bool:
    body = {"data": [{"Subject": f"Interaction: {contact_name}", "Description": note, "Activity_Type": "Calls"}]}
    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.post(
            f"{ZOHO_BASE}/Activities",
            headers={"Authorization": f"Zoho-oauthtoken {access_token}"},
            json=body,
        )
        return resp.status_code in (200, 201)

async def find_or_create_contact(access_token: str, name: str, phone: Optional[str] = None) -> Optional[str]:
    search_resp = None
    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.get(
            f"{ZOHO_BASE}/Contacts/search?criteria=(Last_Name:equals:{name})",
            headers={"Authorization": f"Zoho-oauthtoken {access_token}"},
        )
        if resp.status_code == 200:
            data = resp.json().get("data", [])
            if data:
                return data[0].get("id")
        create_resp = await client.post(
            f"{ZOHO_BASE}/Contacts",
            headers={"Authorization": f"Zoho-oauthtoken {access_token}"},
            json={"data": [{"Last_Name": name, "Phone": phone or ""}]},
        )
        if create_resp.status_code in (200, 201):
            return create_resp.json().get("data", [{}])[0].get("details", {}).get("id")
    return None
