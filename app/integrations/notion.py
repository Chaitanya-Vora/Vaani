"""
Notion Integration — Vaani's storage brain.

Creates and manages a complete Indian business workspace in Notion:
- Notes database
- Tasks database
- CRM (Clients) database
- Expenses database
- Meetings database
- Compliance tracker
- Invoice log
"""

import asyncio
from datetime import datetime
from typing import Optional

import httpx
import structlog

log = structlog.get_logger(__name__)

NOTION_API = "https://api.notion.com/v1"
NOTION_VERSION = "2022-06-28"


def _headers(token: str) -> dict:
    return {
        "Authorization": f"Bearer {token}",
        "Notion-Version": NOTION_VERSION,
        "Content-Type": "application/json",
    }


# ── Workspace Setup ───────────────────────────────────────────────────────────

async def setup_vaani_workspace(access_token: str, business_name: str) -> dict:
    """
    One-time setup: create the complete Vaani Second Brain in user's Notion.
    Returns database IDs for all created databases.
    """
    # Create parent page
    parent_page = await _create_page(
        token=access_token,
        parent={"type": "workspace", "workspace": True},
        title=f"🧠 {business_name} — Vaani Brain",
        icon="🧠",
    )
    parent_id = parent_page["id"]

    # Create all databases in parallel
    databases = await asyncio.gather(
        _create_notes_db(access_token, parent_id),
        _create_tasks_db(access_token, parent_id),
        _create_crm_db(access_token, parent_id),
        _create_expenses_db(access_token, parent_id),
        _create_meetings_db(access_token, parent_id),
        _create_compliance_db(access_token, parent_id),
        _create_invoices_db(access_token, parent_id),
        _create_commitments_db(access_token, parent_id),
        _create_habits_db(access_token, parent_id),
        _create_content_db(access_token, parent_id),
        return_exceptions=True,
    )

    db_names = ["notes", "tasks", "crm", "expenses", "meetings", "compliance", "invoices", "commitments", "habits", "content"]
    result = {"parent_page_id": parent_id}

    for name, db in zip(db_names, databases):
        if isinstance(db, Exception):
            log.warning(f"notion.setup.{name}_failed", error=str(db))
        else:
            result[f"{name}_db_id"] = db.get("id")

    log.info("notion.workspace_created", business=business_name, parent=parent_id)
    return result

def _founders_ledger_properties() -> dict:
    return {
        "Project": {"select": {"options": []}},
        "Contact": {"select": {"options": []}},
        "Priority": {"select": {
            "options": [
                {"name": "P1 - Critical", "color": "red"},
                {"name": "P2 - High", "color": "orange"},
                {"name": "P3 - Normal", "color": "yellow"}
            ]
        }}
    }


async def _create_notes_db(token: str, parent_id: str) -> dict:
    props = {
        "Title": {"title": {}},
        "Summary": {"rich_text": {}},
        "Tags": {"multi_select": {"options": [
            {"name": "meeting", "color": "blue"},
            {"name": "idea", "color": "green"},
            {"name": "research", "color": "purple"},
            {"name": "personal", "color": "yellow"},
        ]}},
        "Source": {"select": {"options": [
            {"name": "WhatsApp", "color": "green"},
            {"name": "Telegram", "color": "blue"},
            {"name": "Email", "color": "orange"},
        ]}},
        "Date": {"date": {}},
    }
    props.update(_founders_ledger_properties())
    return await _create_database(
        token=token,
        parent_id=parent_id,
        title="📝 Notes",
        icon="📝",
        properties=props,
    )


async def _create_tasks_db(token: str, parent_id: str) -> dict:
    return await _create_database(
        token=token,
        parent_id=parent_id,
        title="✅ Tasks",
        icon="✅",
        properties={
            "Task": {"title": {}},
            "Status": {"select": {"options": [
                {"name": "To Do", "color": "red"},
                {"name": "In Progress", "color": "yellow"},
                {"name": "Done", "color": "green"},
            ]}},
            "Due Date": {"date": {}},
            "Client": {"rich_text": {}},
            "Priority": {"select": {"options": [
                {"name": "High", "color": "red"},
                {"name": "Medium", "color": "yellow"},
                {"name": "Low", "color": "gray"},
            ]}},
            "Source": {"rich_text": {}},
        },
    )


async def _create_crm_db(token: str, parent_id: str) -> dict:
    return await _create_database(
        token=token,
        parent_id=parent_id,
        title="👥 Clients",
        icon="👥",
        properties={
            "Name": {"title": {}},
            "Company": {"rich_text": {}},
            "Phone": {"phone_number": {}},
            "Email": {"email": {}},
            "GSTIN": {"rich_text": {}},
            "Status": {"select": {"options": [
                {"name": "Active", "color": "green"},
                {"name": "Prospect", "color": "blue"},
                {"name": "Inactive", "color": "gray"},
            ]}},
            "Outstanding (₹)": {"number": {"format": "rupee"}},
            "Last Contact": {"date": {}},
            "Next Follow-up": {"date": {}},
            "Tags": {"multi_select": {}},
        },
    )


async def _create_expenses_db(token: str, parent_id: str) -> dict:
    return await _create_database(
        token=token,
        parent_id=parent_id,
        title="💰 Expenses",
        icon="💰",
        properties={
            "Description": {"title": {}},
            "Amount (₹)": {"number": {"format": "rupee"}},
            "GST Amount (₹)": {"number": {"format": "rupee"}},
            "Category": {"select": {"options": [
                {"name": "Travel", "color": "blue"},
                {"name": "Office", "color": "gray"},
                {"name": "Software", "color": "purple"},
                {"name": "Meals", "color": "orange"},
                {"name": "Marketing", "color": "pink"},
                {"name": "Client", "color": "green"},
                {"name": "Misc", "color": "default"},
            ]}},
            "Vendor": {"rich_text": {}},
            "Date": {"date": {}},
            "Tally Synced": {"checkbox": {}},
        },
    )


async def _create_meetings_db(token: str, parent_id: str) -> dict:
    return await _create_database(
        token=token,
        parent_id=parent_id,
        title="🤝 Meetings",
        icon="🤝",
        properties={
            "Title": {"title": {}},
            "Date": {"date": {}},
            "Attendees": {"rich_text": {}},
            "Action Items Count": {"number": {}},
            "Follow-up Date": {"date": {}},
            "Client": {"rich_text": {}},
        },
    )


async def _create_compliance_db(token: str, parent_id: str) -> dict:
    return await _create_database(
        token=token,
        parent_id=parent_id,
        title="🇮🇳 Compliance",
        icon="⚖️",
        properties={
            "Filing": {"title": {}},
            "Due Date": {"date": {}},
            "Period": {"rich_text": {}},
            "Status": {"select": {"options": [
                {"name": "Pending", "color": "red"},
                {"name": "Filed", "color": "green"},
                {"name": "Extended", "color": "yellow"},
            ]}},
            "Type": {"select": {"options": [
                {"name": "GST", "color": "orange"},
                {"name": "TDS", "color": "blue"},
                {"name": "Income Tax", "color": "purple"},
                {"name": "ROC", "color": "pink"},
                {"name": "SEBI", "color": "red"},
            ]}},
            "Client": {"rich_text": {}},
            "Penalty (₹/day)": {"number": {"format": "rupee"}},
        },
    )


async def _create_invoices_db(token: str, parent_id: str) -> dict:
    return await _create_database(
        token=token,
        parent_id=parent_id,
        title="🧾 Invoices",
        icon="🧾",
        properties={
            "Invoice No": {"title": {}},
            "Client": {"rich_text": {}},
            "Amount (₹)": {"number": {"format": "rupee"}},
            "GST (₹)": {"number": {"format": "rupee"}},
            "Total (₹)": {"number": {"format": "rupee"}},
            "Status": {"select": {"options": [
                {"name": "Draft", "color": "gray"},
                {"name": "Sent", "color": "blue"},
                {"name": "Paid", "color": "green"},
                {"name": "Overdue", "color": "red"},
            ]}},
            "Due Date": {"date": {}},
            "PDF Link": {"url": {}},
        },
    )

async def _create_commitments_db(token: str, parent_id: str) -> dict:
    props = {
        "Commitment": {"title": {}},
        "Deadline": {"date": {}},
        "Status": {"select": {"options": [
            {"name": "Active", "color": "red"},
            {"name": "Completed", "color": "green"}
        ]}},
        "Recipient": {"rich_text": {}}
    }
    props.update(_founders_ledger_properties())
    return await _create_database(token, parent_id, "🤝 Commitment Board", "🤝", props)

async def _create_habits_db(token: str, parent_id: str) -> dict:
    return await _create_database(
        token=token,
        parent_id=parent_id,
        title="🔥 Daily Habits",
        icon="🔥",
        properties={
            "Habit": {"title": {}},
            "Date": {"date": {}},
            "Status": {"select": {"options": [
                {"name": "Done", "color": "green"},
                {"name": "Missed", "color": "red"}
            ]}},
            "Streak": {"number": {}}
        }
    )

async def _create_content_db(token: str, parent_id: str) -> dict:
    return await _create_database(
        token=token,
        parent_id=parent_id,
        title="📱 Content Calendar",
        icon="📱",
        properties={
            "Title": {"title": {}},
            "Content Type": {"select": {"options": [
                {"name": "LinkedIn Post", "color": "blue"},
                {"name": "Twitter/X Thread", "color": "default"},
                {"name": "Newsletter", "color": "green"},
                {"name": "Blog Post", "color": "orange"},
            ]}},
            "Status": {"select": {"options": [
                {"name": "Draft", "color": "gray"},
                {"name": "Approved", "color": "green"},
                {"name": "Scheduled", "color": "blue"},
                {"name": "Published", "color": "pink"}
            ]}},
            "Scheduled Date": {"date": {}},
            "Copy & Media Text": {"rich_text": {}},
        }
    )

# ── Write Operations ──────────────────────────────────────────────────────────

async def create_note_page(
    access_token: str,
    workspace_meta: dict,
    title: str,
    summary: str,
    key_points: list,
    action_items: list,
    tags: list,
    source_text: str = "",
) -> Optional[str]:
    """Create a note page in the Notes database."""
    db_id = workspace_meta.get("notes_db_id")
    if not db_id:
        return None

    # Build Notion blocks for rich content
    children = [
        _heading("📋 Summary", level=2),
        _paragraph(summary),
    ]

    if key_points:
        children.append(_heading("🔑 Key Points", level=2))
        for point in key_points:
            children.append(_bullet(point))

    if action_items:
        children.append(_heading("✅ Action Items", level=2))
        for item in action_items:
            children.append(_todo(item))

    if source_text:
        children.append(_heading("🎙️ Original", level=3))
        children.append(_quote(source_text[:1000]))

    properties = {
        "Title": _title_prop(title),
        "Date": _date_prop(datetime.now().date().isoformat()),
        "Source": _select_prop("WhatsApp"),
    }
    if tags:
        properties["Tags"] = _multi_select_prop(tags[:5])

    page = await _create_db_page(access_token, db_id, properties, children)
    return page.get("url") if page else None


async def create_task_entry(
    access_token: str,
    workspace_meta: dict,
    title: str,
    due_date: Optional[str] = None,
    client: Optional[str] = None,
    priority: str = "Medium",
) -> Optional[str]:
    db_id = workspace_meta.get("tasks_db_id")
    if not db_id:
        return None

    properties = {
        "Task": _title_prop(title),
        "Status": _select_prop("To Do"),
        "Priority": _select_prop(priority),
    }
    if due_date:
        properties["Due Date"] = _date_prop(due_date)
    if client:
        properties["Client"] = _text_prop(client)

    page = await _create_db_page(access_token, db_id, properties)
    return page.get("url") if page else None


async def create_meeting_page(
    access_token: str,
    workspace_meta: dict,
    meeting_data: dict,
) -> Optional[str]:
    db_id = workspace_meta.get("meetings_db_id")
    if not db_id:
        return None

    children = []

    if meeting_data.get("discussion_points"):
        children.append(_heading("💬 Discussion", level=2))
        for point in meeting_data["discussion_points"]:
            children.append(_bullet(str(point)))

    if meeting_data.get("decisions"):
        children.append(_heading("🎯 Decisions", level=2))
        for d in meeting_data["decisions"]:
            children.append(_bullet(str(d)))

    if meeting_data.get("action_items"):
        children.append(_heading("✅ Action Items", level=2))
        for item in meeting_data["action_items"]:
            if isinstance(item, dict):
                text = f"{item.get('task', '')} — {item.get('owner', 'TBD')}"
                if item.get("due_date"):
                    text += f" (by {item['due_date']})"
                children.append(_todo(text))

    properties = {
        "Title": _title_prop(meeting_data.get("title", "Meeting")),
        "Date": _date_prop(meeting_data.get("date") or datetime.now().date().isoformat()),
        "Action Items Count": {"number": len(meeting_data.get("action_items", []))},
    }
    if meeting_data.get("attendees"):
        properties["Attendees"] = _text_prop(", ".join(meeting_data["attendees"][:10]))

    page = await _create_db_page(access_token, db_id, properties, children)
    return page.get("url") if page else None


async def update_crm_entry(
    access_token: str,
    workspace_meta: dict,
    client_name: str,
    interaction_note: str,
    follow_up_date: Optional[str] = None,
    notion_page_id: Optional[str] = None,
) -> Optional[str]:
    db_id = workspace_meta.get("crm_db_id")
    if not db_id:
        return None

    children = [
        _heading(f"📞 {datetime.now().strftime('%d %b %Y')}", level=3),
        _paragraph(interaction_note),
    ]

    if notion_page_id:
        # Append to existing page
        await _append_blocks(access_token, notion_page_id, children)
        if follow_up_date:
            await _update_page_properties(
                access_token, notion_page_id,
                {"Next Follow-up": _date_prop(follow_up_date), "Last Contact": _date_prop(datetime.now().date().isoformat())}
            )
        # Return existing page URL
        page = await _get_page(access_token, notion_page_id)
        return page.get("url") if page else None
    else:
        # Create new CRM entry
        properties = {
            "Name": _title_prop(client_name),
            "Last Contact": _date_prop(datetime.now().date().isoformat()),
            "Status": _select_prop("Active"),
        }
        if follow_up_date:
            properties["Next Follow-up"] = _date_prop(follow_up_date)

        page = await _create_db_page(access_token, db_id, properties, children)
        return page.get("url") if page else None


async def create_expense_entry(
    access_token: str,
    workspace_meta: dict,
    amount_inr: float,
    category: str,
    description: str,
    date: str,
    vendor: str = "",
) -> Optional[str]:
    db_id = workspace_meta.get("expenses_db_id")
    if not db_id:
        return None

    category_map = {
        "travel": "Travel", "petrol": "Travel", "fuel": "Travel",
        "office": "Office", "rent": "Office",
        "software": "Software", "saas": "Software", "subscription": "Software",
        "food": "Meals", "meal": "Meals", "lunch": "Meals", "dinner": "Meals",
        "marketing": "Marketing", "ads": "Marketing",
        "client": "Client",
    }
    notion_cat = category_map.get(category.lower(), "Misc")

    properties = {
        "Description": _title_prop(description[:100]),
        "Amount (₹)": {"number": float(amount_inr)},
        "Category": _select_prop(notion_cat),
        "Date": _date_prop(date),
        "Tally Synced": {"checkbox": False},
    }
    if vendor:
        properties["Vendor"] = _text_prop(vendor)

    page = await _create_db_page(access_token, db_id, properties)
    return page.get("url") if page else None


async def create_compliance_entry(
    access_token: str,
    workspace_meta: dict,
    filing_name: str,
    due_date: str,
    compliance_type: str,
    period: str = "",
    client_name: str = "",
    penalty_per_day: float = 0,
) -> Optional[str]:
    db_id = workspace_meta.get("compliance_db_id")
    if not db_id:
        return None

    properties = {
        "Filing": _title_prop(filing_name),
        "Due Date": _date_prop(due_date),
        "Type": _select_prop(compliance_type),
        "Status": _select_prop("Pending"),
    }
    if period:
        properties["Period"] = _text_prop(period)
    if client_name:
        properties["Client"] = _text_prop(client_name)
    if penalty_per_day:
        properties["Penalty (₹/day)"] = {"number": penalty_per_day}

    page = await _create_db_page(access_token, db_id, properties)
    return page.get("url") if page else None


async def create_commitment_entry(
    access_token: str,
    workspace_meta: dict,
    commitment_text: str,
    deadline: str,
    recipient: str = "",
) -> Optional[str]:
    db_id = workspace_meta.get("commitments_db_id")
    if not db_id:
        return None

    properties = {
        "Commitment": _title_prop(commitment_text),
        "Deadline": _date_prop(deadline),
        "Status": _select_prop("Active")
    }
    if recipient:
        properties["Recipient"] = _text_prop(recipient)

    page = await _create_db_page(access_token, db_id, properties)
    return page.get("url") if page else None


async def create_habit_entry(
    access_token: str,
    workspace_meta: dict,
    habit_name: str,
    date_str: str,
    streak: int = 1,
) -> Optional[str]:
    db_id = workspace_meta.get("habits_db_id")
    if not db_id:
        return None

    properties = {
        "Habit": _title_prop(habit_name),
        "Date": _date_prop(date_str),
        "Status": _select_prop("Done"),
        "Streak": {"number": streak}
    }

    page = await _create_db_page(access_token, db_id, properties)
    return page.get("url") if page else None

async def create_content_entry(
    access_token: str,
    workspace_meta: dict,
    title: str,
    content_body: str,
    content_type: str,
) -> Optional[str]:
    db_id = workspace_meta.get("content_db_id")
    if not db_id:
        return None

    # Map our internal logic back to Notion valid tags
    cat_map = {
        "LinkedIn post": "LinkedIn Post",
        "newsletter": "Newsletter",
        "blog post": "Blog Post"
    }
    mapped_type = cat_map.get(content_type, "LinkedIn Post")

    children = [
        _heading("📝 Autogenerated Copy", level=2),
        _paragraph(content_body),
    ]

    properties = {
        "Title": _title_prop(title),
        "Content Type": _select_prop(mapped_type),
        "Status": _select_prop("Draft"),
        "Scheduled Date": _date_prop(datetime.now().date().isoformat()),
        "Copy & Media Text": _text_prop(content_body[:2000])
    }

    page = await _create_db_page(access_token, db_id, properties, children)
    return page.get("url") if page else None

async def append_template_content(
    access_token: str,
    page_id: str,
    sections: list,
) -> Optional[str]:
    """Appends structured JSON sections to an existing page."""
    children = []
    for sec in sections:
        children.append(_heading(sec.get("heading", ""), level=2))
        for point in sec.get("bullets", []):
            if isinstance(point, str):
                children.append(_bullet(point))

    await _append_blocks(access_token, page_id, children)
    page = await _get_page(access_token, page_id)
    return page.get("url") if page else None

# ── Notion API Primitives ─────────────────────────────────────────────────────

async def _create_database(token: str, parent_id: str, title: str, icon: str, properties: dict) -> dict:
    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.post(
            f"{NOTION_API}/databases",
            headers=_headers(token),
            json={
                "parent": {"type": "page_id", "page_id": parent_id},
                "icon": {"type": "emoji", "emoji": icon},
                "title": [{"type": "text", "text": {"content": title}}],
                "properties": properties,
            },
        )
        resp.raise_for_status()
        return resp.json()


async def _create_db_page(
    token: str, db_id: str, properties: dict, children: list = None
) -> dict:
    body = {
        "parent": {"database_id": db_id},
        "properties": properties,
    }
    if children:
        body["children"] = children[:100]  # Notion limit

    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.post(
            f"{NOTION_API}/pages",
            headers=_headers(token),
            json=body,
        )
        if resp.status_code not in (200, 201):
            log.warning("notion.create_page_failed", status=resp.status_code, body=resp.text[:300])
            return {}
        return resp.json()


async def _create_page(token: str, parent: dict, title: str, icon: str = "📄") -> dict:
    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.post(
            f"{NOTION_API}/pages",
            headers=_headers(token),
            json={
                "parent": parent,
                "icon": {"type": "emoji", "emoji": icon},
                "properties": {
                    "title": [{"type": "text", "text": {"content": title}}]
                },
            },
        )
        resp.raise_for_status()
        return resp.json()


async def _append_blocks(token: str, page_id: str, children: list) -> dict:
    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.patch(
            f"{NOTION_API}/blocks/{page_id}/children",
            headers=_headers(token),
            json={"children": children},
        )
        return resp.json()


async def _update_page_properties(token: str, page_id: str, properties: dict) -> dict:
    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.patch(
            f"{NOTION_API}/pages/{page_id}",
            headers=_headers(token),
            json={"properties": properties},
        )
        return resp.json()


async def _get_page(token: str, page_id: str) -> dict:
    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.get(
            f"{NOTION_API}/pages/{page_id}",
            headers=_headers(token),
        )
        return resp.json() if resp.status_code == 200 else {}


# ── Block Builders ─────────────────────────────────────────────────────────────

def _heading(text: str, level: int = 2) -> dict:
    tag = f"heading_{level}"
    return {
        "object": "block",
        "type": tag,
        tag: {"rich_text": [{"type": "text", "text": {"content": text}}]},
    }


def _paragraph(text: str) -> dict:
    return {
        "object": "block",
        "type": "paragraph",
        "paragraph": {"rich_text": [{"type": "text", "text": {"content": text[:2000]}}]},
    }


def _bullet(text: str) -> dict:
    return {
        "object": "block",
        "type": "bulleted_list_item",
        "bulleted_list_item": {"rich_text": [{"type": "text", "text": {"content": str(text)[:2000]}}]},
    }


def _todo(text: str, checked: bool = False) -> dict:
    return {
        "object": "block",
        "type": "to_do",
        "to_do": {
            "rich_text": [{"type": "text", "text": {"content": str(text)[:2000]}}],
            "checked": checked,
        },
    }


def _quote(text: str) -> dict:
    return {
        "object": "block",
        "type": "quote",
        "quote": {"rich_text": [{"type": "text", "text": {"content": text[:2000]}}]},
    }


# ── Property Builders ─────────────────────────────────────────────────────────

def _title_prop(text: str) -> dict:
    return {"title": [{"type": "text", "text": {"content": str(text)[:2000]}}]}


def _text_prop(text: str) -> dict:
    return {"rich_text": [{"type": "text", "text": {"content": str(text)[:2000]}}]}


def _select_prop(name: str) -> dict:
    return {"select": {"name": name}}


def _multi_select_prop(names: list) -> dict:
    return {"multi_select": [{"name": str(n)[:100]} for n in names]}


def _date_prop(date_str: str) -> dict:
    return {"date": {"start": date_str}}


async def get_recent_pages(access_token: str, limit: int = 5) -> list[str]:
    """Fetch the titles of the most recently edited pages across the workspace."""
    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.post(
            f"{NOTION_API}/search",
            headers=_headers(access_token),
            json={
                "sort": {"direction": "descending", "timestamp": "last_edited_time"},
                "page_size": limit,
            },
        )
        if resp.status_code != 200:
            return []
        data = resp.json()
        titles = []
        for result in data.get("results", []):
            if result.get("object") == "page":
                props = result.get("properties", {})
                for prop_name, prop_val in props.items():
                    if prop_val.get("type") == "title":
                        title_arr = prop_val.get("title", [])
                        if title_arr:
                            titles.append(title_arr[0].get("plain_text", ""))
                        break
        return [t for t in titles if t]
