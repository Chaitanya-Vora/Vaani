"""
WhatsApp Business Cloud API handler.
Receives messages, routes them through the AI pipeline, sends responses.
"""

import hashlib
import hmac
import json
import time
from typing import Optional

import httpx
import structlog

from app.config import settings

log = structlog.get_logger(__name__)

WA_BASE = "https://graph.facebook.com/v19.0"


# ── Webhook verification ───────────────────────────────────────────────────────

def verify_webhook(mode: str, token: str, challenge: str) -> Optional[str]:
    """Verify Meta webhook setup request."""
    if mode == "subscribe" and token == settings.WHATSAPP_VERIFY_TOKEN:
        return challenge
    return None


def verify_webhook_signature(payload: bytes, signature: str) -> bool:
    """
    Verify X-Hub-Signature-256 on incoming webhooks.
    Uses WHATSAPP_WEBHOOK_SECRET — separate from the access token.
    """
    if not settings.WHATSAPP_WEBHOOK_SECRET:
        return settings.ENV != "production"   # skip in dev if not configured
    expected = "sha256=" + hmac.new(
        settings.WHATSAPP_WEBHOOK_SECRET.encode(),
        payload,
        hashlib.sha256,
    ).hexdigest()
    return hmac.compare_digest(expected, signature)


# ── Parsing ───────────────────────────────────────────────────────────────────

def parse_whatsapp_message(payload: dict) -> Optional[dict]:
    """
    Parse Meta webhook payload into normalized message dict.
    Returns None if not a message event we care about.
    """
    try:
        entry = payload.get("entry", [{}])[0]
        changes = entry.get("changes", [{}])[0]
        value = changes.get("value", {})

        if "messages" not in value:
            return None

        message = value["messages"][0]
        contact = value.get("contacts", [{}])[0]
        metadata = value.get("metadata", {})

        msg_type = message.get("type")
        from_number = message.get("from")

        parsed = {
            "channel": "whatsapp",
            "message_id": message.get("id"),
            "from_number": from_number,
            "from_name": contact.get("profile", {}).get("name", ""),
            "timestamp": message.get("timestamp"),
            "phone_number_id": metadata.get("phone_number_id"),
            "type": msg_type,
            "text": None,
            "audio_url": None,
            "image_url": None,
            "document_url": None,
            "media_id": None,
        }

        if msg_type == "text":
            parsed["text"] = message.get("text", {}).get("body", "")

        elif msg_type in ("audio", "voice"):
            parsed["media_id"] = message.get("audio", {}).get("id") or message.get("voice", {}).get("id")
            parsed["audio_url"] = f"{WA_BASE}/{parsed['media_id']}"

        elif msg_type == "image":
            parsed["media_id"] = message.get("image", {}).get("id")
            parsed["image_url"] = f"{WA_BASE}/{parsed['media_id']}"
            parsed["caption"] = message.get("image", {}).get("caption", "")

        elif msg_type == "document":
            doc = message.get("document", {})
            parsed["media_id"] = doc.get("id")
            parsed["document_url"] = f"{WA_BASE}/{parsed['media_id']}"
            parsed["filename"] = doc.get("filename", "document")

        return parsed

    except Exception as e:
        log.error("whatsapp.parse_error", error=str(e), payload=str(payload)[:500])
        return None


async def get_media_url(media_id: str) -> Optional[str]:
    """Resolve a WhatsApp media ID to a download URL."""
    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.get(
            f"{WA_BASE}/{media_id}",
            headers={"Authorization": f"Bearer {settings.WHATSAPP_ACCESS_TOKEN}"},
        )
        if resp.status_code == 200:
            return resp.json().get("url")
        log.warning("whatsapp.media_url_failed", media_id=media_id, status=resp.status_code)
        return None


# ── Sending ───────────────────────────────────────────────────────────────────

async def send_text_message(to: str, text: str) -> bool:
    """Send a text message via WhatsApp Cloud API."""
    # WA has a 4096 char limit — truncate gracefully
    if len(text) > 4000:
        text = text[:3990] + "…\n\n_Full content saved to Notion._"

    payload = {
        "messaging_product": "whatsapp",
        "recipient_type": "individual",
        "to": to,
        "type": "text",
        "text": {"preview_url": False, "body": text},
    }
    return await _send(payload)


async def send_template_message(to: str, template_name: str, params: list[str]) -> bool:
    """
    Send a WhatsApp template message (pre-approved by Meta).
    Required for outbound messages (reminders, compliance alerts).
    """
    payload = {
        "messaging_product": "whatsapp",
        "to": to,
        "type": "template",
        "template": {
            "name": template_name,
            "language": {"code": "en_IN"},
            "components": [
                {
                    "type": "body",
                    "parameters": [{"type": "text", "text": p} for p in params],
                }
            ],
        },
    }
    return await _send(payload)


async def send_interactive_buttons(
    to: str,
    body: str,
    buttons: list[dict],  # [{"id": "...", "title": "..."}]
) -> bool:
    """Send a message with quick-reply buttons (max 3)."""
    payload = {
        "messaging_product": "whatsapp",
        "to": to,
        "type": "interactive",
        "interactive": {
            "type": "button",
            "body": {"text": body},
            "action": {
                "buttons": [
                    {"type": "reply", "reply": {"id": b["id"], "title": b["title"]}}
                    for b in buttons[:3]
                ]
            },
        },
    }
    return await _send(payload)


async def send_compliance_alert(to: str, compliance_type: str, due_date: str, days_remaining: int) -> bool:
    """
    Send Indian compliance reminder via WhatsApp.
    Uses approved template: vaani_compliance_reminder
    """
    emoji = "🔴" if days_remaining <= 1 else ("🟡" if days_remaining <= 3 else "🟢")
    urgency = "TODAY" if days_remaining == 0 else (f"in {days_remaining} days" if days_remaining > 0 else "OVERDUE")

    text = f"""{emoji} *Compliance Reminder*

*{compliance_type}* is due *{urgency}*
Due date: {due_date}

Reply *DONE* to mark complete or *HELP* for filing guide.

_Vaani — apka business ka AI dimag_"""
    return await send_text_message(to, text)


async def mark_message_read(message_id: str) -> bool:
    """Mark a received message as read (shows double blue tick)."""
    payload = {
        "messaging_product": "whatsapp",
        "status": "read",
        "message_id": message_id,
    }
    async with httpx.AsyncClient(timeout=5.0) as client:
        try:
            resp = await client.post(
                f"{WA_BASE}/{settings.WHATSAPP_PHONE_NUMBER_ID}/messages",
                headers={
                    "Authorization": f"Bearer {settings.WHATSAPP_ACCESS_TOKEN}",
                    "Content-Type": "application/json",
                },
                json=payload,
            )
            return resp.status_code == 200
        except Exception:
            return False


async def send_typing_indicator(to: str) -> None:
    """Send typing indicator while processing (shows '...' in chat)."""
    # WhatsApp doesn't have a formal typing API — we send a read receipt
    pass


# ── Private ───────────────────────────────────────────────────────────────────

async def _send(payload: dict) -> bool:
    async with httpx.AsyncClient(timeout=15.0) as client:
        try:
            resp = await client.post(
                f"{WA_BASE}/{settings.WHATSAPP_PHONE_NUMBER_ID}/messages",
                headers={
                    "Authorization": f"Bearer {settings.WHATSAPP_ACCESS_TOKEN}",
                    "Content-Type": "application/json",
                },
                json=payload,
            )
            if resp.status_code not in (200, 201):
                log.error("whatsapp.send_failed", status=resp.status_code, body=resp.text[:300])
                return False
            return True
        except Exception as e:
            log.error("whatsapp.send_error", error=str(e))
            return False
