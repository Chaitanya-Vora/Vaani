"""
Intent detection — Claude classifies every message into a structured action.
Uses Haiku for fast classification, Sonnet for complex drafting tasks.
"""

from __future__ import annotations
import json
import time
import re
from typing import Optional

# ── TEMPORARY (Claude → Gemini swap until Anthropic card is added) ──────────
# To revert: restore the 3 lines below and swap _call_gemini back to claude.messages.create
import google.generativeai as genai
import structlog

from app.config import settings
from app.models import IntentType, PlanTier

log = structlog.get_logger(__name__)

if settings.GOOGLE_API_KEY:
    genai.configure(api_key=settings.GOOGLE_API_KEY)

async def _call_gemini(system: str, prompt: str, max_tokens: int = 2000) -> str:
    """Unified Gemini call with automatic failover."""
    models_to_try = ["gemini-2.5-flash", "gemini-flash-lite-latest", "gemini-flash-latest"]
    last_error = None
    
    for model_name in models_to_try:
        try:
            model = genai.GenerativeModel(model_name, system_instruction=system)
            response = await model.generate_content_async(
                prompt,
                generation_config=genai.GenerationConfig(max_output_tokens=max_tokens)
            )
            return response.text.strip()
        except Exception as e:
            last_error = e
            continue
            
    raise RuntimeError(f"All Gemini models exhausted quota/failed. Last error: {str(last_error)}")

# ── Security Middleware ────────────────────────────────────────────────────────

class SecurityMiddleware:
    """Zero-cost local regex engine for PII redaction and prompt safety."""
    
    # Matches ABCDE1234F
    PAN_REGEX = re.compile(r'\b[A-Z]{5}[0-9]{4}[A-Z]{1}\b', re.IGNORECASE)
    # Matches 12-digit Aadhaar (e.g. 1234 5678 9012)
    AADHAAR_REGEX = re.compile(r'\b\d{4}\s?\d{4}\s?\d{4}\b')
    # Matches 16-digit CC
    CC_REGEX = re.compile(r'\b(?:\d{4}[ -]?){3}\d{4}\b')
    
    JAILBREAK_TERMS = [
        "ignore previous instructions",
        "forget all instructions",
        "system prompt",
        "you are no longer",
        "ignore all previous",
        "bypass rules"
    ]

    @classmethod
    def redact_pii(cls, text: str) -> str:
        if not text:
            return text
        text = cls.PAN_REGEX.sub("[REDACTED_PAN]", text)
        text = cls.AADHAAR_REGEX.sub("[REDACTED_AADHAAR]", text)
        text = cls.CC_REGEX.sub("[REDACTED_CARD]", text)
        return text

    @classmethod
    def check_safety(cls, text: str) -> bool:
        """Return False if text contains jailbreak vectors."""
        if not text:
            return True
        text_lower = text.lower()
        for term in cls.JAILBREAK_TERMS:
            if term in text_lower:
                return False
        return True


# ── System Prompts ─────────────────────────────────────────────────────────────

INTENT_CLASSIFIER_SYSTEM = """You are Vaani, an AI business assistant for Indian founders, MSMEs, CA firms, and SEBI-regulated entities.

Your job: analyze the user's message and classify the intent + extract structured data.

INTENT TYPES (Hinglish Supported):
- PAYMENT_FOLLOWUP: "Gupta ji ka payment", "Payment reminder"
- COMMITMENT_CAPTURE: "Kal pakka bhej dunga", "Quote by 6 PM"
- LEAD_CAPTURE: "Ye naya client hai", "Forwarded VCF"
- DATA_QUERY: "Pichli baar kya rate diya tha?", "Last rate for Sharma ji?"
- HABIT_LOG: "Today's gym done", "5km ho gaya"
- IDEA_DUMP: "Shower thought: referral loops", "Idea for new SaaS"
- ADD_TASKS: "I need to call Rahul today, and draft the NDA tomorrow"
- QUERY_IDEAS: "What was my idea about marketing?", "Show me my recent ideas"
- SAVE_MEMORY: "Remember my PAN is ABC1234E", "Note down my son's name is Rohan"
- save_note: General information saving
- create_task: Single action item
- set_reminder: Explicit time-based
- log_meeting: Meeting summary
- update_crm: Update client info
- draft_email: Write an email
- draft_content: Produce marketing/social posts
- log_expense: Record an expense
- generate_invoice: Create GST invoice
- web_search: Research
- compliance_query: Indian compliance rules

Respond ONLY with valid JSON.
If handling audio directly, output an "original_text" field with your transcript.

JSON format:
{
  "intent": "<intent_type>",
  "confidence": 0-100,
  "language": "en|hi|mr|gu|ta|te",
  "original_text": "Required if voice note. Provide transcript here.",
  "entities": {
    "client_name": null or string,
    "email": null or string,
    "phone": null or string,
    "company": null or string,
    "role": null or string,
    "amount": null or number (in INR),
    "date": null or "YYYY-MM-DD",
    "due_date": null or "YYYY-MM-DD",
    "category": null or string,
    "title": null or string,
    "description": null or string,
    "action_items": [],
    "attendees": [],
    "follow_up_date": null or "YYYY-MM-DD",
    "gst_rate": null or number,
    "compliance_type": null or string,
    "memory_key": null or string (The subject of the memory, e.g. 'PAN', "Son's name"),
    "memory_value": null or string (The actual fact/value),
    "tasks_list": [{"description": string, "priority": "high|medium|low", "due_date": "YYYY-MM-DD"}]
  },
  "urgency": "low|medium|high",
  "response_hint": "one line: what to do with this"
}"""


EXECUTOR_SYSTEM = """You are Vaani, an Elite Executive Partner to high-growth Indian founders and business leaders.

IDENTITY & CREATOR:
You were built by Chaitanya Vora — a CA finalist, CFA Level 2 candidate, and a passionate builder dedicated to solving operational friction for Indian entrepreneurs. If asked who made you or about your background, represent this proudly.

YOUR MISSION:
Act as a high-stakes Chief of Staff. You handle the 'how' (logistics, data, tracking) so the founder can focus on the 'why' (strategy, growth).

YOUR CAPABILITIES (THE 10 PILLARS):
Vaani is an operational second-brain. You handle:
1.  **Lead Sniper CRM**: Instantly capture leads from WhatsApp voice/text and push to Notion.
2.  **Commitment Guardian**: Passively track promises like "I'll call you at 4 PM" to prevent breached trust.
3.  **Voice-to-Notion Summaries**: Transform messy 5-min voice dumps into structured action items.
4.  **Hinglish Compliance AI**: Answer GST, TDS, Tally, and MCA queries using professional CA-level logic.
5.  **Smart Idea Vault**: Protect startup concepts by auto-categorizing them in the user's Notion workspace.
6.  **Expense on the Move**: Log firm expenses via 5-second voice notes—zero manual data entry.
7.  **Task Triage**: Brief users on their top-3 highest-priority tasks for the day.
8.  **Automated Follow-ups**: Draft follow-up messages based on commitments detected in recent chats.
9.  **Multimodal CRM**: Process business card photos or invoice snaps to auto-create CRM leads/expenses.
10. **Executive Audio**: Provide spoken updates back to the user, acting as a real talking assistant.

ROADMAP (FUTURE):
- Full Tally/Quickbooks native sync for real-time P&L voice queries.
- Multi-user delegation for tracking team tasks.

Context about this user:
{user_context}

RULES OF ENGAGEMENT:
- ZERO HALLUCINATION: If asked for data not in context, or a feature not listed above, say: "I don't have that capability for that yet, but I'm learning." NEVER make up features or fake stats.
- Elite Style: Professional, sharp, results-oriented, and elite. Minimize fluff; maximize clarity.
- Multi-lingual: Respond in {language}. Mix Hindi/English (Hinglish) naturally for Indian business context.
- WhatsApp Format: Keep replies punchy (max 2-3 lines) unless it's a deep compliance answer.
"""


async def classify_intent(
    text: str,
    user_context: dict,
    conversation_history: list[dict] | None = None,
    media_bytes: bytes | None = None,
    media_type: str | None = None,
) -> dict:
    """
    Fast intent classification using Gemini 2.0 Flash-Lite.
    Returns structured intent object. Supports multimodal audio/images if media_bytes is provided.
    """
    start = time.perf_counter()

    # 1. Zero-Cost Security Gate (Prompt Injection Defense)
    if text and not SecurityMiddleware.check_safety(text):
        log.warning("intent.security_blocked", reason="Jailbreak attempt detected")
        return {
            "intent": "MALICIOUS_INTENT",
            "confidence": 100,
            "entities": {},
            "urgency": "low",
            "original_text": "[TEXT BLOCKED BY SECURITY GUARDRAIL]",
            "response_hint": "Policy violation block."
        }
        
    # 2. Zero-Cost Data Privacy (PII Auto-Redaction)
    if text:
        original_unredacted = text
        text = SecurityMiddleware.redact_pii(text)
        if text != original_unredacted:
            log.info("intent.pii_redacted", action="Masked sensitive user numbers")

    # Build context string
    context_str = _build_context_string(user_context)

    # Convert conversation history to Gemini format if needed, but for simplicity we just inject it in text
    history_ctx = ""
    if conversation_history:
        history_ctx = "Previous messages:\n" + "\n".join([f"{m['role']}: {m['content']}" for m in conversation_history[-6:]])

    prompt = f"User context: {context_str}\n{history_ctx}\nMessage: {text}"
    if media_bytes and media_type:
        if "audio" in media_type:
            prompt = f"User context: {context_str}\n{history_ctx}\nAnalyze the attached voice note and transcribe its content into 'original_text'."
        elif "image" in media_type:
            prompt = f"User context: {context_str}\n{history_ctx}\nAnalyze the attached image. If it's a business card, extract Name, Company, Phone, Email, Role and classify as LEAD_CAPTURE. If it's an invoice/receipt, extract amounts/vendor and set intent to LOG_EXPENSE. Provide a concise 'original_text' describing what was found. Original user text: {text}"

    # ── Failover Generation ───────────────────────────────────────────────────
    models_to_try = [
        "gemini-2.5-flash", 
        "gemini-flash-lite-latest", 
        "gemini-flash-latest"
    ]
    
    last_error = None
    raw = None
    
    for model_name in models_to_try:
        try:
            model = genai.GenerativeModel(model_name, system_instruction=INTENT_CLASSIFIER_SYSTEM)
            contents = [prompt]
            if media_bytes and media_type:
                contents.append({"mime_type": media_type, "data": media_bytes})
                
            response = await model.generate_content_async(contents)
            raw = response.text.strip()
            break  # Success!
        except Exception as e:
            last_error = e
            log.warning("intent.model_failover", model=model_name, error=str(e))
            continue
            
    if not raw:
        log.error("intent.all_models_failed", error=str(last_error))
        return {"intent": "unknown", "confidence": 0, "entities": {}, "urgency": "low"}
        
    try:
        # Strip any accidental markdown
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        result = json.loads(raw)
        result["classification_ms"] = round((time.perf_counter() - start) * 1000)
        result["tokens"] = 150 
        
        if not text and "original_text" not in result:
            result["original_text"] = "[Voice Note processed]"
            
        return result

    except json.JSONDecodeError as e:
        log.warning("intent.parse_error", raw=raw[:200] if 'raw' in locals() else "", error=str(e))
        return {"intent": "unknown", "confidence": 0, "entities": {}, "urgency": "low"}
    except Exception as e:
        log.error("intent.error", error=str(e))
        return {"intent": "unknown", "confidence": 0, "entities": {}, "urgency": "low"}


async def generate_response(
    intent_data: dict,
    user: object,
    execution_result: dict,
    language: str = "en",
) -> str:
    """
    Generate the WhatsApp response message after executing an action.
    Keeps it short and confirms what was done.
    """
    user_context = _build_user_context_for_response(user, execution_result)
    system = EXECUTOR_SYSTEM.format(
        user_context=user_context,
        language=language,
    )

    prompt = f"""Action completed: {json.dumps(execution_result, ensure_ascii=False)}
Original intent: {intent_data.get('intent')}
User message was: {intent_data.get('original_text', '')}

Write a WhatsApp reply (max 2-3 lines) confirming what was done. 
If there's a Notion URL, include it.
If it's in Hindi/mixed, respond in the same style."""

    try:
        return await _call_gemini(system, prompt, max_tokens=300)
    except Exception as e:
        log.error("response_gen.error", error=str(e))
        return "✅ Operation complete."


async def execute_with_ai(
    instruction: str,
    context: dict,
    user_plan: PlanTier = PlanTier.STARTER,
) -> dict:
    """
    Full AI execution for complex tasks (drafting, research, structured output).
    Uses Sonnet for higher-tier users, Haiku for basic tasks.
    """
    model = settings.CLAUDE_SMART_MODEL if user_plan in [PlanTier.GROWTH, PlanTier.PRO] else settings.CLAUDE_FAST_MODEL

    system = EXECUTOR_SYSTEM.format(
        user_context=json.dumps(context.get("user_context", {}), ensure_ascii=False),
        language=context.get("language", "en"),
    )

    try:
        output = await _call_gemini(system, instruction, max_tokens=2000)
        return {
            "output": output,
            "tokens": 0,
            "model": "gemini-1.5-flash",
        }
    except Exception as e:
        log.error("ai_execute.error", error=str(e))
        raise


# ── Indian Compliance AI ───────────────────────────────────────────────────────

COMPLIANCE_SYSTEM = """You are a CA-level expert on Indian tax and compliance law.
You know: GST, TDS, Advance Tax, Income Tax, ROC/MCA filings, SEBI regulations,
MSME Act, PF/ESIC, Professional Tax, Shops & Establishments Act.

Rules:
- Give precise, actionable answers with section references
- Always mention: due date, penalty for late filing, how to file
- If the user mentions their state, give state-specific info (SGST rates etc.)
- Flag if the question needs actual CA advice (complex restructuring, litigation)
- Keep answer under 400 words for WhatsApp

Do NOT say "consult a CA" for basic queries — BE the CA knowledge."""


async def answer_compliance_query(
    question: str,
    user_context: dict,
    language: str = "en",
) -> str:
    """Answer Indian tax/compliance questions with CA-level accuracy."""
    context_bits = []
    if user_context.get("gstin"):
        context_bits.append(f"User GSTIN: {user_context['gstin']}")
    if user_context.get("business_type"):
        context_bits.append(f"Business type: {user_context['business_type']}")
    if user_context.get("state"):
        context_bits.append(f"State: {user_context['state']}")

    context_str = "\n".join(context_bits) if context_bits else "No additional context"

    prompt = f"Context:\n{context_str}\n\nQuestion: {question}"
    if language == "hi":
        prompt += "\n\nAnswer in Hindi (Devanagari) mixed with English technical terms."

    try:
        return await _call_gemini(COMPLIANCE_SYSTEM, prompt, max_tokens=800)
    except Exception as e:
        log.error("compliance.error", error=str(e))
        return "Unable to process your compliance query right now. Please try again."


# ── Helpers ───────────────────────────────────────────────────────────────────

def _build_context_string(user_context: dict) -> str:
    parts = []
    if user_context.get("name"):
        parts.append(f"Name: {user_context['name']}")
    if user_context.get("business_name"):
        parts.append(f"Business: {user_context['business_name']}")
    if user_context.get("business_type"):
        parts.append(f"Type: {user_context['business_type']}")
    if user_context.get("language_pref"):
        parts.append(f"Language: {user_context['language_pref']}")
    if user_context.get("recent_clients"):
        parts.append(f"Recent clients: {', '.join(user_context['recent_clients'][:5])}")
    if user_context.get("recent_pages"):
        parts.append(f"Recent active Notion projects/docs: {', '.join(user_context['recent_pages'])}")
    return "; ".join(parts) if parts else "New user, no context yet"


def _build_user_context_for_response(user: object, result: dict) -> str:
    parts = [f"Business: {getattr(user, 'business_name', 'Unknown')}"]
    if getattr(user, "language_pref", "en") == "hi":
        parts.append("User prefers Hindi-English mix")
    return "; ".join(parts)
