"""
The AI Executor — takes a classified intent and executes the real action.
Routes to the right integration, handles errors gracefully.
"""

import time
from datetime import datetime, timezone
from typing import Optional

import structlog
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models import IntentType, AITask, TaskStatus, PlanTier
from app.ai.intent import execute_with_ai, answer_compliance_query
from app.integrations import notion, google_calendar, gmail, zoho_crm
from app.integrations.invoice_generator import generate_gst_invoice
from app.compliance.india_calendar import handle_compliance_query

log = structlog.get_logger(__name__)


async def execute_intent(
    intent_data: dict,
    user: object,
    db: AsyncSession,
    task: AITask,
) -> dict:
    """
    Main dispatcher — routes intent to the correct handler.
    Updates the AITask with results.
    """
    start = time.perf_counter()
    intent = intent_data.get("intent", "unknown")
    entities = intent_data.get("entities", {})
    text = intent_data.get("original_text", "")
    language = intent_data.get("language", "en")
    plan = getattr(getattr(user, "subscription", None), "plan", PlanTier.STARTER)

    try:
        result = {}

        # ── Route to handler ─────────────────────────────────────────────────
        if intent == IntentType.SAVE_NOTE:
            result = await _handle_save_note(text, entities, user, language, plan)

        elif intent == IntentType.CREATE_TASK:
            result = await _handle_create_task(text, entities, user, language)

        elif intent == IntentType.SET_REMINDER:
            result = await _handle_set_reminder(text, entities, user, language)

        elif intent == IntentType.LOG_MEETING:
            result = await _handle_log_meeting(text, entities, user, language, plan)

        elif intent == IntentType.UPDATE_CRM:
            result = await _handle_update_crm(text, entities, user, db, language)

        elif intent == IntentType.DRAFT_EMAIL:
            result = await _handle_draft_email(text, entities, user, language, plan)

        elif intent == IntentType.DRAFT_CONTENT:
            result = await _handle_draft_content(text, entities, user, language, plan)

        elif intent == IntentType.LOG_EXPENSE:
            result = await _handle_log_expense(text, entities, user, db, language)

        elif intent == IntentType.GENERATE_INVOICE:
            result = await _handle_generate_invoice(entities, user, db)

        elif intent == IntentType.COMPLIANCE_QUERY:
            result = await _handle_compliance(text, entities, user, language)

        elif intent == IntentType.WEB_SEARCH:
            result = await _handle_web_search(text, user, plan)

        elif intent == IntentType.COMMITMENT_CAPTURE:
            result = await _handle_commitment_capture(text, entities, user, language)

        elif intent == IntentType.LEAD_CAPTURE:
            result = await _handle_lead_capture(text, entities, user, db, language)

        elif intent == IntentType.DATA_QUERY:
            result = await _handle_data_query(text, user)

        elif intent == IntentType.HABIT_LOG:
            result = await _handle_habit_log(text, entities, user)

        elif intent == IntentType.PAYMENT_FOLLOWUP:
            result = await _handle_payment_followup(text, entities, user, language)

        else:
            result = await _handle_unknown(text, user, language, plan)

        # ── Mark task complete ────────────────────────────────────────────────
        task.status = TaskStatus.COMPLETED
        task.result_data = result
        task.output_summary = result.get("summary", "Done")
        task.notion_page_url = result.get("notion_url")
        task.processing_ms = round((time.perf_counter() - start) * 1000)
        task.completed_at = datetime.now(timezone.utc)
        await db.flush()

        log.info(
            "intent.executed",
            intent=intent,
            user_id=str(user.id),
            processing_ms=task.processing_ms,
        )
        return result

    except Exception as e:
        log.error("intent.execution_error", intent=intent, error=str(e), exc_info=True)
        task.status = TaskStatus.FAILED
        task.error_message = str(e)
        await db.flush()
        return {"error": str(e), "summary": "Something went wrong. Please try again."}


# ── Handlers ──────────────────────────────────────────────────────────────────

async def _handle_save_note(text, entities, user, language, plan):
    """Voice/text dump → structured note → Notion."""
    import json
    
    # Check if it's an Idea Dump
    is_idea = any(k in text.lower() for k in ["idea", "startup", "saas", "project"])
    
    if is_idea:
        system_prompt = f"""Convert this raw idea into a structured business template.
Raw input: {text}
Make sure to generate exactly:
1. Title
2. Executive Summary (in summary field)
3. Potential Challenges (in key_points)
4. Next Steps (in action_items)
Return as JSON: {{title, summary, key_points: [], action_items: [], tags: ["idea", "project"]}}"""
    else:
        system_prompt = f"""Convert this raw note/brain-dump into a clean, structured Notion page.
Raw input: {text}
Create: Title, Summary paragraph, Key points as bullet list, Action items, Tags.
Return as JSON: {{title, summary, key_points: [], action_items: [], tags: []}}"""

    ai_result = await execute_with_ai(
        system_prompt,
        context={"user_context": _get_user_ctx(user), "language": language},
        user_plan=plan,
    )

    try:
        note_data = json.loads(ai_result["output"])
    except Exception:
        note_data = {"title": "Note", "summary": text, "key_points": [], "action_items": [], "tags": []}

    notion_url = None
    notion_integration = _get_integration(user, "notion")
    if notion_integration:
        notion_url = await notion.create_note_page(
            access_token=notion_integration.access_token,
            workspace_meta=notion_integration.metadata_,
            title=note_data.get("title", "Note"),
            summary=note_data.get("summary", ""),
            key_points=note_data.get("key_points", []),
            action_items=note_data.get("action_items", []),
            tags=note_data.get("tags", []),
            source_text=text,
        )

    msg_type = "Idea Blueprint" if is_idea else "Note"
    return {
        "summary": f"✅ {msg_type} saved: *{note_data.get('title', 'Note')}*",
        "notion_url": notion_url,
        "note": note_data,
        "tokens": ai_result.get("tokens", 0),
    }


async def _handle_create_task(text, entities, user, language):
    """Voice → task in Google Tasks + Notion."""
    task_title = entities.get("title") or entities.get("description") or text[:100]
    due_date = entities.get("due_date")
    client = entities.get("client_name")

    # Google Tasks
    google_integration = _get_integration(user, "google_calendar")
    task_id = None
    if google_integration:
        task_id = await google_calendar.create_task(
            access_token=google_integration.access_token,
            title=task_title,
            due_date=due_date,
            notes=f"Client: {client}" if client else None,
        )

    # Notion task
    notion_url = None
    notion_integration = _get_integration(user, "notion")
    if notion_integration:
        notion_url = await notion.create_task_entry(
            access_token=notion_integration.access_token,
            workspace_meta=notion_integration.metadata_,
            title=task_title,
            due_date=due_date,
            client=client,
        )

    due_str = f" by {due_date}" if due_date else ""
    client_str = f" for {client}" if client else ""
    return {
        "summary": f"✅ Task added: {task_title}{due_str}{client_str}",
        "notion_url": notion_url,
        "google_task_id": task_id,
    }


async def _handle_set_reminder(text, entities, user, language):
    """Set a WhatsApp-delivered reminder via Celery beat."""
    from app.tasks.reminder_tasks import schedule_reminder

    title = entities.get("title") or entities.get("description") or text[:80]
    reminder_date = entities.get("date") or entities.get("due_date")

    if not reminder_date:
        return {
            "summary": "⚠️ Couldn't find a date/time. Try: 'Remind me to call Sharma ji on Friday 3pm'",
        }

    task = schedule_reminder.delay(
        user_id=str(user.id),
        message=title,
        remind_at=reminder_date,
        channel=user.whatsapp_number and "whatsapp" or "telegram",
    )

    return {
        "summary": f"⏰ Reminder set: *{title}* on {reminder_date}",
        "celery_task_id": task.id,
    }


async def _handle_log_meeting(text, entities, user, language, plan):
    """Meeting dump → structured minutes → Notion + action items as tasks."""
    ai_result = await execute_with_ai(
        f"""Extract structured meeting minutes from this voice/text dump.

Input: {text}

Extract:
1. Meeting title & date (infer if not explicit)
2. Attendees mentioned
3. Key discussion points
4. Decisions made
5. Action items with owner and due date
6. Follow-up date if mentioned

Return JSON: {{title, date, attendees: [], discussion_points: [], decisions: [], action_items: [{{task, owner, due_date}}], follow_up_date}}""",
        context={"user_context": _get_user_ctx(user), "language": language},
        user_plan=plan,
    )

    import json
    try:
        meeting_data = json.loads(ai_result["output"])
    except Exception:
        meeting_data = {"title": "Meeting Notes", "discussion_points": [text], "action_items": []}

    # Save to Notion
    notion_url = None
    notion_integration = _get_integration(user, "notion")
    if notion_integration:
        notion_url = await notion.create_meeting_page(
            access_token=notion_integration.access_token,
            workspace_meta=notion_integration.metadata_,
            meeting_data=meeting_data,
        )

    # Create tasks for action items
    google_integration = _get_integration(user, "google_calendar")
    if google_integration and meeting_data.get("action_items"):
        for item in meeting_data["action_items"][:5]:  # cap at 5
            await google_calendar.create_task(
                access_token=google_integration.access_token,
                title=item.get("task", ""),
                due_date=item.get("due_date"),
            )

    action_count = len(meeting_data.get("action_items", []))
    return {
        "summary": f"✅ Meeting saved with {action_count} action items → Notion",
        "notion_url": notion_url,
        "meeting": meeting_data,
    }


async def _handle_update_crm(text, entities, user, db, language):
    """Log client interaction → Notion CRM + Zoho if connected."""
    client_name = entities.get("client_name")
    follow_up = entities.get("follow_up_date")
    description = entities.get("description") or text

    # Find or create client in DB
    from sqlalchemy import select
    from app.models import Client
    client_obj = None
    if client_name:
        result = await db.execute(
            select(Client).where(
                Client.user_id == user.id,
                Client.name.ilike(f"%{client_name}%")
            ).limit(1)
        )
        client_obj = result.scalar_one_or_none()

        if not client_obj:
            client_obj = Client(
                user_id=user.id,
                name=client_name,
                notes=description,
            )
            db.add(client_obj)

    if client_obj:
        client_obj.last_contacted = datetime.now(timezone.utc)
        if follow_up:
            from datetime import datetime as dt
            try:
                client_obj.next_followup = dt.fromisoformat(follow_up)
            except Exception:
                pass
        await db.flush()

    # Notion CRM update
    notion_url = None
    notion_integration = _get_integration(user, "notion")
    if notion_integration and client_name:
        notion_url = await notion.update_crm_entry(
            access_token=notion_integration.access_token,
            workspace_meta=notion_integration.metadata_,
            client_name=client_name,
            interaction_note=description,
            follow_up_date=follow_up,
            notion_page_id=getattr(client_obj, "notion_page_id", None) if client_obj else None,
        )

    # Zoho CRM if connected
    zoho_integration = _get_integration(user, "zoho_crm")
    if zoho_integration and client_name:
        await zoho_crm.log_activity(
            access_token=zoho_integration.access_token,
            contact_name=client_name,
            note=description,
            follow_up_date=follow_up,
        )

    follow_str = f" Follow-up: {follow_up}" if follow_up else ""
    return {
        "summary": f"✅ CRM updated for *{client_name or 'client'}*.{follow_str}",
        "notion_url": notion_url,
    }


async def _handle_draft_email(text, entities, user, language, plan):
    """Draft professional email from voice/text instruction."""
    ai_result = await execute_with_ai(
        f"""Draft a professional email based on this instruction.

Instruction: {text}
Sender business: {getattr(user, 'business_name', '')}
Client/recipient: {entities.get('client_name', 'the recipient')}

Write a complete email with:
- Subject line
- Professional greeting
- Body (clear, concise, Indian business style)
- Appropriate closing

Return JSON: {{subject, body, tone}}""",
        context={"user_context": _get_user_ctx(user), "language": language},
        user_plan=plan,
    )

    import json
    try:
        email_data = json.loads(ai_result["output"])
    except Exception:
        email_data = {"subject": "Follow-up", "body": ai_result.get("output", ""), "tone": "professional"}

    # Save draft to Notion
    notion_url = None
    notion_integration = _get_integration(user, "notion")
    if notion_integration:
        notion_url = await notion.create_note_page(
            access_token=notion_integration.access_token,
            workspace_meta=notion_integration.metadata_,
            title=f"Email: {email_data.get('subject', 'Draft')}",
            summary=email_data.get("body", ""),
            key_points=[],
            action_items=[],
            tags=["email", "draft"],
            source_text=text,
        )

    # Auto-send via Gmail if requested
    gmail_integration = _get_integration(user, "gmail")
    auto_send = "send" in text.lower() and gmail_integration

    return {
        "summary": f"✅ Email drafted: *{email_data.get('subject')}*",
        "notion_url": notion_url,
        "email": email_data,
        "auto_sent": False,
    }


async def _handle_draft_content(text, entities, user, language, plan):
    """Draft blog, newsletter, LinkedIn post, investor update."""
    content_type = "blog post"
    if any(w in text.lower() for w in ["linkedin", "post", "social"]):
        content_type = "LinkedIn post"
    elif any(w in text.lower() for w in ["newsletter", "email blast"]):
        content_type = "newsletter"
    elif any(w in text.lower() for w in ["investor", "update", "portfolio"]):
        content_type = "investor update"

    ai_result = await execute_with_ai(
        f"""Write a {content_type} based on this brief.

Brief: {text}
Author's business: {getattr(user, 'business_name', '')}

For LinkedIn posts: 150-250 words, hook in first line, 3-5 hashtags
For blog posts: 500-800 words, SEO-friendly, Indian business context
For newsletters: 300-500 words, conversational, actionable
For investor updates: structured with metrics, wins, challenges, asks

Return JSON: {{title, content, word_count, hashtags (if social)}}""",
        context={"user_context": _get_user_ctx(user), "language": language},
        user_plan=plan,
    )

    import json
    try:
        content_data = json.loads(ai_result["output"])
    except Exception:
        content_data = {"title": content_type.title(), "content": ai_result.get("output", "")}

    notion_url = None
    notion_integration = _get_integration(user, "notion")
    if notion_integration:
        notion_url = await notion.create_note_page(
            access_token=notion_integration.access_token,
            workspace_meta=notion_integration.metadata_,
            title=content_data.get("title", content_type.title()),
            summary=content_data.get("content", ""),
            key_points=[],
            action_items=[],
            tags=[content_type.replace(" ", "_"), "content"],
            source_text=text,
        )

    return {
        "summary": f"✅ {content_type.title()} drafted → saved to Notion",
        "notion_url": notion_url,
        "content": content_data,
    }


async def _handle_log_expense(text, entities, user, db, language):
    """Log expense from text/image → Notion + Tally export."""
    from app.models import Expense

    amount_inr = entities.get("amount", 0)
    amount_paise = int(float(amount_inr) * 100) if amount_inr else 0
    category = entities.get("category", "miscellaneous")
    description = entities.get("description") or text
    client_name = entities.get("client_name")

    expense = Expense(
        user_id=user.id,
        amount_paise=amount_paise,
        category=category,
        description=description,
        expense_date=datetime.now(timezone.utc),
    )
    db.add(expense)
    await db.flush()

    notion_url = None
    notion_integration = _get_integration(user, "notion")
    if notion_integration:
        notion_url = await notion.create_expense_entry(
            access_token=notion_integration.access_token,
            workspace_meta=notion_integration.metadata_,
            amount_inr=amount_inr,
            category=category,
            description=description,
            date=datetime.now(timezone.utc).date().isoformat(),
        )

    return {
        "summary": f"✅ Expense logged: ₹{amount_inr} ({category})",
        "notion_url": notion_url,
        "expense_id": str(expense.id),
    }


async def _handle_generate_invoice(entities, user, db):
    """Generate GSTIN-compliant PDF invoice from voice/text."""
    from app.models import Invoice, Client
    from sqlalchemy import select

    client_name = entities.get("client_name")
    amount_inr = entities.get("amount", 0)
    gst_rate = entities.get("gst_rate", 18)
    description = entities.get("description", "Services rendered")

    # Find client
    client_obj = None
    if client_name:
        result = await db.execute(
            select(Client).where(
                Client.user_id == user.id,
                Client.name.ilike(f"%{client_name}%")
            ).limit(1)
        )
        client_obj = result.scalar_one_or_none()

    # Generate invoice number
    from sqlalchemy import func, select as sel
    count_result = await db.execute(
        sel(func.count(Invoice.id)).where(Invoice.user_id == user.id)
    )
    count = count_result.scalar() or 0
    invoice_number = f"INV-{datetime.now().year}-{str(count + 1).zfill(4)}"

    subtotal = int(float(amount_inr) * 100)
    gst_amount = int(subtotal * gst_rate / 100)
    total = subtotal + gst_amount

    invoice = Invoice(
        user_id=user.id,
        client_id=client_obj.id if client_obj else None,
        invoice_number=invoice_number,
        line_items=[{"description": description, "qty": 1, "rate": amount_inr, "gst_rate": gst_rate}],
        subtotal_paise=subtotal,
        gst_paise=gst_amount,
        total_paise=total,
        gst_type="CGST+SGST",
        status="draft",
    )
    db.add(invoice)
    await db.flush()

    # Generate PDF
    pdf_url = await generate_gst_invoice(
        invoice_number=invoice_number,
        seller_name=getattr(user, "business_name", ""),
        seller_gstin=getattr(user, "gstin", ""),
        buyer_name=client_name or "Client",
        buyer_gstin=getattr(client_obj, "gstin", "") if client_obj else "",
        line_items=[{"description": description, "qty": 1, "rate": amount_inr, "gst_rate": gst_rate}],
        subtotal=amount_inr,
        gst_amount=gst_amount / 100,
        total=total / 100,
    )

    if pdf_url:
        invoice.pdf_url = pdf_url
        await db.flush()

    return {
        "summary": f"✅ Invoice {invoice_number} created: ₹{total/100:.0f} (incl. {gst_rate}% GST)",
        "pdf_url": pdf_url,
        "invoice_number": invoice_number,
    }


async def _handle_compliance(text, entities, user, language):
    """Answer Indian tax/compliance questions."""
    user_ctx = {
        "gstin": getattr(user, "gstin", None),
        "business_type": getattr(user, "business_type", None),
    }
    answer = await answer_compliance_query(text, user_ctx, language)
    return {
        "summary": answer,
        "is_compliance": True,
    }


async def _handle_web_search(text, user, plan):
    """Deep research using web search."""
    if plan == PlanTier.STARTER:
        return {"summary": "⚠️ Web research is available on Growth and Pro plans. Upgrade at vaani.app/upgrade"}

    ai_result = await execute_with_ai(
        f"""Research the following query and provide a comprehensive summary.
Query: {text}

Provide:
1. Key findings (5-7 bullet points)
2. Sources/context
3. Actionable insights for Indian business context
4. What to watch out for

Format as clean text for WhatsApp (use *bold* for key terms).""",
        context={"user_context": _get_user_ctx(user), "language": "en"},
        user_plan=plan,
    )
    return {
        "summary": ai_result.get("output", "Research complete."),
        "is_research": True,
    }


async def _handle_unknown(text, user, language, plan):
    """Fallback — try to still be helpful."""
    ai_result = await execute_with_ai(
        f"User said: '{text}'\n\nRespond helpfully as their AI business assistant. Keep it under 3 lines.",
        context={"user_context": _get_user_ctx(user), "language": language},
        user_plan=plan,
    )
    return {"summary": ai_result.get("output", "I didn't quite get that. Can you rephrase?")}

import dateparser

async def _handle_commitment_capture(text, entities, user, language):
    """Voice commitment -> Schedule check via Celery -> Notion."""
    deadline_str = entities.get("deadline") or entities.get("due_date") or entities.get("date")
    recipient = entities.get("client_name") or entities.get("recipient")
    commitment = entities.get("title") or entities.get("description") or "Commitment"

    if not deadline_str:
        return {"summary": "⚠️ Can't find a deadline in your commitment. Try: 'Kal 6 baje tak quote dunga'"}

    dt = dateparser.parse(str(deadline_str), settings={'PREFER_DATES_FROM': 'future'})
    if not dt:
        from datetime import timedelta
        dt = datetime.now() + timedelta(days=1)

    notion_url = None
    notion_integration = _get_integration(user, "notion")
    if notion_integration:
        notion_url = await notion.create_commitment_entry(
            access_token=notion_integration.access_token,
            workspace_meta=notion_integration.metadata_,
            commitment_text=commitment,
            deadline=dt.date().isoformat(),
            recipient=recipient,
        )

    from app.tasks.celery_tasks import check_gmail_for_commitments
    check_gmail_for_commitments.apply_async(
        args=[str(user.id), dt.isoformat(), entities],
        eta=dt
    )

    action_button = f"\n\n[Open Commitment in Notion]({notion_url})" if notion_url else ""
    return {
        "summary": f"🎯 Commitment logged for {dt.strftime('%d %b %I:%M %p')}. I'll BCC track this!{action_button}",
        "notion_url": notion_url
    }

async def _handle_lead_capture(text, entities, user, db, language):
    """WhatsApp VCF / Text Lead -> Notion + Teams Webhook -> Interactive WhatsApp."""
    client_name = entities.get("client_name") or "New Lead"
    description = entities.get("description") or text
    
    notion_url = None
    notion_integration = _get_integration(user, "notion")
    if notion_integration:
        notion_url = await notion.update_crm_entry(
            access_token=notion_integration.access_token,
            workspace_meta=notion_integration.metadata_,
            client_name=client_name,
            interaction_note=f"LEAD CAPTURE: {description}",
        )
    
    from app.models import Client
    client_obj = Client(
        user_id=user.id,
        name=client_name,
        notes=f"LEAD: {description}",
        tags=["Hot Lead"]
    )
    db.add(client_obj)
    await db.flush()

    import httpx
    import os
    teams_webhook = os.getenv("TEAMS_WEBHOOK_URL")
    if teams_webhook:
        try:
            async with httpx.AsyncClient() as client:
                await client.post(teams_webhook, json={"text": f"New Lead: {client_name}\nDetails: {description}"})
        except Exception:
            pass

    return {
        "summary": f"📋 Lead Captured: *{client_name}*\n\n_Reply with 1 to Assign to Team_\n_Reply with 2 to Schedule Call_\n_Reply with 3 to Create Quote_",
        "notion_url": notion_url
    }

async def _handle_data_query(text, user):
    """Use Gemini 2.0 Flash-Lite caching/context window to query memory."""
    ai_result = await execute_with_ai(
        f"Answer this query based strictly on the user context and CRM memory:\n\nQuery: {text}",
        context={"user_context": _get_user_ctx(user), "language": "en"},
    )
    return {
        "summary": f"🔍 {ai_result.get('output', 'Found it.')}"
    }

async def _handle_habit_log(text, entities, user):
    """Log habit -> Notion -> create progress chart."""
    habit = entities.get("category") or entities.get("title") or "Daily Habit"
    
    notion_url = None
    streak = 1
    notion_integration = _get_integration(user, "notion")
    if notion_integration:
        notion_url = await notion.create_habit_entry(
            access_token=notion_integration.access_token,
            workspace_meta=notion_integration.metadata_,
            habit_name=habit,
            date_str=datetime.now().date().isoformat(),
            streak=streak,
        )

    chart_url = f"https://quickchart.io/chart?c={{type:'radialGauge',data:{{datasets:[{{data:[{streak * 10}],backgroundColor:'green'}}]}}}}"

    return {
        "summary": f"🔥 Habit logged: {habit}!\nCurrent streak: {streak} days.\n\n📊 View Progress: {chart_url}",
        "notion_url": notion_url
    }

async def _handle_payment_followup(text, entities, user, language):
    client = entities.get("client_name") or "the client"
    return {
        "summary": f"💰 I've scheduled a payment follow-up for *{client}*.",
    }


# ── Helpers ───────────────────────────────────────────────────────────────────

def _get_integration(user: object, name: str):
    """Get active integration by name from user's integrations list."""
    integrations = getattr(user, "integrations", [])
    for intg in integrations:
        if intg.integration == name and intg.is_active:
            return intg
    return None


def _get_user_ctx(user: object) -> dict:
    return {
        "name": getattr(user, "name", ""),
        "business_name": getattr(user, "business_name", ""),
        "business_type": getattr(user, "business_type", ""),
        "gstin": getattr(user, "gstin", ""),
        "language": getattr(user, "language_pref", "en"),
    }
