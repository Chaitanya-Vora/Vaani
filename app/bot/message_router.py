"""
Message Router — the central nervous system of Vaani.

Flow: Incoming message → identify user → transcribe if voice
      → classify intent → check usage limits → execute → respond
"""

import time
from datetime import datetime, timezone
from typing import Optional

import structlog
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from sqlalchemy.orm import selectinload

from app.config import settings
from app.models import (
    User, Message, AITask, Subscription,
    MessageChannel, MessageType, IntentType, TaskStatus, PlanTier
)
from app.ai.transcription import _download_audio
from app.ai.intent import classify_intent, generate_response
from app.ai.executor import execute_intent
from app.ai.voice import generate_voice_response, cleanup_voice_file
from app.bot.whatsapp import send_text_message as wa_send, mark_message_read
from app.bot.telegram import (
    send_telegram_message as tg_send, 
    send_telegram_voice as tg_send_voice,
    get_telegram_file_url
)
from app.database import get_redis

log = structlog.get_logger(__name__)

# Monthly task limits per plan
PLAN_LIMITS = {
    PlanTier.STARTER: settings.PLAN_STARTER_TASKS,
    PlanTier.GROWTH: settings.PLAN_GROWTH_TASKS,
    PlanTier.PRO: settings.PLAN_PRO_TASKS,
}


async def route_whatsapp_message(parsed_msg: dict, db: AsyncSession) -> None:
    """Entry point for WhatsApp messages."""
    if not parsed_msg or not parsed_msg.get("from_number"):
        return

    # Mark as read immediately (shows double blue tick)
    if parsed_msg.get("message_id"):
        await mark_message_read(parsed_msg["message_id"])

    await _process_message(
        channel=MessageChannel.WHATSAPP,
        channel_identifier=parsed_msg["from_number"],
        parsed=parsed_msg,
        db=db,
        send_fn=lambda text: wa_send(parsed_msg["from_number"], text),
    )


async def route_telegram_message(parsed_msg: dict, db: AsyncSession) -> None:
    """Entry point for Telegram messages with Identity Linking support."""
    if not parsed_msg or not parsed_msg.get("telegram_chat_id"):
        return

    chat_id = parsed_msg["telegram_chat_id"]
    text = parsed_msg.get("text", "")
    
    # ── 0. IDENTITY LINKING COMMAND & GUIDANCE ──
    clean_text = text.lower().strip()
    
    if clean_text.startswith("/link"):
        parts = text.split()
        if len(parts) == 2 and "@" in parts[1]:
            email = parts[1].lower().strip()
            # Find dashboard user by email with eager loading
            res = await db.execute(
                select(User)
                .options(selectinload(User.subscription))
                .where(User.email == email)
            )
            dash_user = res.scalar_one_or_none()
            
            if dash_user:
                # Bridge accounts
                dash_user.telegram_chat_id = chat_id
                await db.flush()
                await tg_send(chat_id, f"✅ *Executive Bridge established!*\n\nWelcome back, {dash_user.name or 'Boss'}. Your Telegram ID is now linked to your dashboard account ({email}). Every action you take here will show up on your live dashboard instantly.")
                return
            else:
                await tg_send(chat_id, f"❌ I couldn't find a Vaani account for `{email}`. Please sign up at vaani-nine.vercel.app/auth/signup first.")
                return
        else:
            await tg_send(chat_id, "ℹ️ *Identity Bridge Command*\n\nUsage: `/link your_email@example.com` to sync your bot with your dashboard.")
            return

    # Friendly Onboarding for 'Hi'
    if clean_text in ["hi", "hello", "hey", "namaste"]:
        await tg_send(chat_id, "Namaste! 🎙️ I'm your Vaani Executive Assistant.\n\nTo sync this bot with your dashboard and see your profile name, please send:\n\n`/link your_email@example.com`")
        return

    # Voice/Text Preference Toggles
    if clean_text in ["/voice", "/text"]:
        # Find user
        res = await db.execute(select(User).where(User.telegram_chat_id == chat_id))
        user_pref = res.scalar_one_or_none()
        if user_pref:
            user_pref.reply_in_audio = (clean_text == "/voice")
            await db.flush()
            mode = "Voice 🎙️" if user_pref.reply_in_audio else "Text 📝"
            await tg_send(chat_id, f"✅ Preferences updated! I will now reply to you in {mode}.")
        else:
            await tg_send(chat_id, "⚠️ I couldn't find your account. Please say 'hi' to start!")
        return

    await _process_message(
        channel=MessageChannel.TELEGRAM,
        channel_identifier=chat_id,
        parsed=parsed_msg,
        db=db,
        send_fn=lambda text: tg_send(chat_id, text),
    )


# ── Core pipeline ─────────────────────────────────────────────────────────────

async def _process_message(
    channel: MessageChannel,
    channel_identifier: str,
    parsed: dict,
    db: AsyncSession,
    send_fn,
) -> None:
    """Core pipeline with 'Guardian' error handling for resilience."""
    try:
        await _process_message_core(channel, channel_identifier, parsed, db, send_fn)
    except Exception as e:
        log.exception("message_router.pipeline_failed", error=str(e))
        await send_fn("⚠️ _Vaani is experiencing a brief synchronization lag. I am still tracking your intent, but I may take longer than usual to respond._")

async def _process_message_core(
    channel: MessageChannel,
    channel_identifier: str,
    parsed: dict,
    db: AsyncSession,
    send_fn,
) -> None:
    start = time.perf_counter()

    # ── 1. Find or onboard user ───────────────────────────────────────────────
    user = await _get_or_create_user(channel, channel_identifier, parsed, db)
    if not user:
        await send_fn("❌ Could not identify your account. Please sign up at vaani.app")
        return

    # ── 2. Check plan limits ──────────────────────────────────────────────────
    limit_check = await _check_usage_limit(user, db)
    if not limit_check["allowed"]:
        await send_fn(limit_check["message"])
        return

    # ── 3. Resolve text content ───────────────────────────────────────────────
    text_content = parsed.get("text", "")
    media_url = None
    media_bytes = None
    media_type = None
    msg_type = MessageType.TEXT

    if parsed.get("type") in ("voice", "audio"):
        msg_type = MessageType.VOICE
        await send_fn("🎙️ _Listening and processing with Gemini Flash-Lite..._")

        # Resolve media URL (WA gives media_id, Telegram gives file_id)
        if channel == MessageChannel.WHATSAPP and parsed.get("audio_url"):
            media_url = parsed["audio_url"]
        elif channel == MessageChannel.TELEGRAM and parsed.get("media_file_id"):
            media_url = await get_telegram_file_url(parsed["media_file_id"])

        if media_url:
            media_bytes = await _download_audio(media_url)
            if not media_bytes:
                await send_fn("⚠️ Couldn't download that voice note. Try sending text.")
                return
            media_type = "audio/ogg"

    elif parsed.get("type") == "image":
        msg_type = MessageType.IMAGE
        text_content = f"[Image]{': ' + parsed.get('caption', '') if parsed.get('caption') else ''}"
        await send_fn("🖼️ _Scanning image/business card with Gemini Vision..._")

        if channel == MessageChannel.WHATSAPP and parsed.get("image_url"):
            media_url = parsed["image_url"]

        if media_url:
            media_bytes = await _download_audio(media_url)
            if not media_bytes:
                await send_fn("⚠️ Couldn't download that image.")
                return
            media_type = "image/jpeg"

    elif parsed.get("type") == "document":
        msg_type = MessageType.DOCUMENT
        text_content = f"[Document: {parsed.get('filename', 'file')}]"

    if not text_content.strip() and not media_bytes:
        return

    # ── 3.5. Psychological Workflow Trap ("Push All") ─────────────────────────
    if text_content.strip().lower() in ["push all", "postpone all", "reschedule all"]:
        result = await db.execute(select(AITask).where(
            AITask.user_id == user.id, 
            AITask.intent == IntentType.COMMITMENT_CAPTURE, 
            AITask.status == TaskStatus.PENDING
        ))
        pushed_count = 0
        for t in result.scalars():
            rd = dict(t.result_data)
            rd["pushed"] = True
            t.result_data = rd
            pushed_count += 1
        await db.commit()
        await send_fn(f"Done. I've aggressively rescheduled {pushed_count} non-critical commitments to tomorrow. Take a breath and focus on what's absolutely vital today.")
        return

    # ── 4. Save raw message to DB ─────────────────────────────────────────────
    db_message = Message(
        user_id=user.id,
        channel=channel,
        message_type=msg_type,
        raw_content=parsed.get("text", ""),
        transcribed_content=None,  # Updated after classification if voice
        media_url=media_url,
        channel_message_id=parsed.get("message_id"),
    )
    db.add(db_message)
    await db.flush()

    # ── 5. Load user context for AI ───────────────────────────────────────────
    user_context = await _build_user_context(user, db)
    conversation_history = await _get_conversation_history(user.id)

    # ── 6. Classify intent via Gemini Flash-Lite ──────────────────────────────
    intent_data = await classify_intent(
        text=text_content,
        user_context=user_context,
        conversation_history=conversation_history,
        media_bytes=media_bytes,
        media_type=media_type,
    )
    
    # If media was provided, update the message with transcribed content directly from Gemini
    if media_bytes and intent_data.get("original_text"):
        db_message.transcribed_content = intent_data["original_text"]
        text_content = intent_data["original_text"]
        await db.flush()

    intent_data["original_text"] = text_content

    log.info(
        "message.classified",
        user_id=str(user.id),
        intent=intent_data.get("intent"),
        confidence=intent_data.get("confidence"),
        channel=channel.value,
    )

    # ── 7. Create AI task record ──────────────────────────────────────────────
    ai_task = AITask(
        user_id=user.id,
        source_message_id=db_message.id,
        intent=IntentType(intent_data.get("intent", "unknown")),
        status=TaskStatus.IN_PROGRESS,
        input_text=text_content,
        tokens_used=intent_data.get("tokens", 0),
    )
    db.add(ai_task)
    await db.flush()

    # Send "thinking" indicator
    if parsed.get("type") not in ("voice", "audio"):
        await send_fn("⚡ _Working on it..._")

    # ── 8. Execute the intent ─────────────────────────────────────────────────
    execution_result = await execute_intent(
        intent_data=intent_data,
        user=user,
        db=db,
        task=ai_task,
    )

    # ── 9. Increment usage counter ────────────────────────────────────────────
    await _increment_usage(user, db)

    # ── 10. Generate WhatsApp-friendly response ───────────────────────────────
    if execution_result.get("error"):
        await send_fn("⚠️ " + execution_result.get("summary", "Something went wrong."))
        return

    response_text = execution_result.get("summary")
    
    # Unleash True Finesse using generate_response for standard intents
    if not execution_result.get("is_compliance") and not execution_result.get("is_research"):
        try:
            finesse_response = await generate_response(
                intent_data=intent_data,
                user=user,
                execution_result=execution_result,
                language=user.language_pref or "en"
            )
            if finesse_response:
                response_text = finesse_response
        except Exception as e:
            log.warning("message_router.finesse_failed", error=str(e))

    if not response_text:
        response_text = "✅ Done!"

    # Append Notion link if available
    notion_url = execution_result.get("notion_url") or execution_result.get("pdf_url")
    if notion_url and "http" in notion_url:
        response_text += f"\n\n🔗 {notion_url}"

    await send_fn(response_text)

    # ── 10.5. Hybrid Voice-Back (Shark Tank Premium) ─────────────────────────
    # If the user preference is 'reply_in_audio' OR they sent a voice note, we speak back.
    if (user.reply_in_audio or msg_type == MessageType.VOICE) and channel == MessageChannel.TELEGRAM:
        voice_path = None
        try:
            # Generate the voice from the finalized response_text
            log.info("message_router.generating_voice", chat_id=str(channel_identifier), forced=user.reply_in_audio)
            lang = user.language_pref or "hi"
            voice_path = generate_voice_response(response_text, language=lang)
            
            if voice_path:
                await tg_send_voice(
                    chat_id=str(channel_identifier), 
                    file_path=voice_path,
                    caption="🎙️ *Vaani AI Audio Feedback*"
                )
                log.info("message_router.voice_sent", chat_id=str(channel_identifier))
        except Exception as e:
            log.warning("message_router.voice_failed", error=str(e))
        finally:
            if voice_path:
                cleanup_voice_file(voice_path)

    # ── 11. Update conversation history in Redis ──────────────────────────────
    await _update_conversation_history(
        user_id=user.id,
        user_msg=text_content,
        assistant_msg=response_text,
    )

    elapsed = round((time.perf_counter() - start) * 1000)
    log.info(
        "message.processed",
        user_id=str(user.id),
        intent=intent_data.get("intent"),
        total_ms=elapsed,
    )


# ── Helpers ───────────────────────────────────────────────────────────────────

async def _get_or_create_user(
    channel: MessageChannel,
    identifier: str,
    parsed: dict,
    db: AsyncSession,
) -> Optional[User]:
    """Find user by channel identifier; create if first time."""
    if channel == MessageChannel.WHATSAPP:
        result = await db.execute(
            select(User)
            .options(selectinload(User.subscription))
            .where(User.whatsapp_number == identifier)
        )
    else:
        result = await db.execute(
            select(User)
            .options(selectinload(User.subscription))
            .where(User.telegram_chat_id == identifier)
        )

    user = result.scalar_one_or_none()

    if not user:
        # Auto-onboard new user with 7-day trial
        from datetime import timedelta
        user = User(
            name=parsed.get("from_name", ""),
            whatsapp_number=identifier if channel == MessageChannel.WHATSAPP else None,
            telegram_chat_id=identifier if channel == MessageChannel.TELEGRAM else None,
            language_pref="en",
            is_active=True,
        )
        db.add(user)
        await db.flush()

        # Create starter subscription with 7-day trial
        trial_end = datetime.now(timezone.utc) + timedelta(days=7)
        sub = Subscription(
            user_id=user.id,
            plan=PlanTier.STARTER,
            status="trial",
            trial_ends_at=trial_end,
            current_period_start=datetime.now(timezone.utc),
        )
        db.add(sub)
        await db.flush()

        log.info("user.created", user_id=str(user.id), channel=channel.value)

        # ── 3. Post-Creation Welcome (EA Persona) ───────────────────────────
        if channel == MessageChannel.TELEGRAM:
            welcome_msg = (
                "Namaste! I'm Chaitanya Vora, founder of Vaani OS. 🎙️\n\n"
                "Welcome to your new *Operational Second Brain*. I've set you up with a 7-day trial of our Starter Plan.\n\n"
                "You can now send me voice notes or text to manage your business—from GST invoices to task tracking.\n\n"
                "**Try saying:** _'Remind me to call Gupta ji tomorrow at 10 AM'_ or _'What are my pending tasks?'_"
            )
            await send_fn(welcome_msg)

    return user


async def _check_usage_limit(user: User, db: AsyncSession) -> dict:
    """Check if user has tasks remaining this month."""
    sub = getattr(user, "subscription", None)
    if not sub:
        return {"allowed": False, "message": "⚠️ No active plan. Sign up at vaani.app"}

    plan = sub.plan or PlanTier.STARTER
    limit = PLAN_LIMITS.get(plan, 50)
    used = sub.tasks_used_this_month or 0

    if used >= limit:
        upgrade_plans = {
            PlanTier.STARTER: "Growth (₹799/mo) for 200 tasks",
            PlanTier.GROWTH: "Pro (₹2499/mo) for unlimited tasks",
        }
        upgrade_msg = upgrade_plans.get(plan, "a higher plan")
        return {
            "allowed": False,
            "message": f"⚠️ You've used all {limit} tasks this month.\n\nUpgrade to {upgrade_msg}: vaani.app/upgrade",
        }

    return {"allowed": True}


async def _increment_usage(user: User, db: AsyncSession) -> None:
    sub = getattr(user, "subscription", None)
    if sub:
        sub.tasks_used_this_month = (sub.tasks_used_this_month or 0) + 1
        await db.flush()


async def _build_user_context(user: User, db: AsyncSession) -> dict:
    """Build rich context object for AI classification."""
    from sqlalchemy import select as sel
    from app.models import Client, Memory

    # Recent client names
    clients_result = await db.execute(
        sel(Client.name).where(Client.user_id == user.id).order_by(
            Client.last_contacted.desc()
        ).limit(10)
    )
    client_names = [r[0] for r in clients_result.all()]

    # Key memories
    memories_result = await db.execute(
        sel(Memory).where(Memory.user_id == user.id).order_by(
            Memory.last_referenced.desc()
        ).limit(20)
    )
    memories = {m.key: m.value for m in memories_result.scalars().all()}

    # Fetch recent Notion pages for "Memory RAG"
    recent_pages = []
    try:
        from app.models import Integration
        integ_result = await db.execute(
            sel(Integration).where(
                Integration.user_id == user.id,
                Integration.provider == "notion"
            )
        )
        notion_integ = integ_result.scalar_one_or_none()
        if notion_integ:
            from app.integrations import notion
            recent_pages = await notion.get_recent_pages(notion_integ.access_token, limit=5)
    except Exception as e:
        log.warning("context.notion_memory_failed", error=str(e))

    return {
        "name": user.name or "",
        "business_name": user.business_name or "",
        "business_type": user.business_type or "",
        "gstin": user.gstin or "",
        "language_pref": user.language_pref or "en",
        "recent_clients": client_names,
        "recent_pages": recent_pages,
        "memories": memories,
        "plan": getattr(getattr(user, "subscription", None), "plan", PlanTier.STARTER),
    }


async def _get_conversation_history(user_id: str) -> list[dict]:
    """Get last 3 conversation turns from Redis."""
    redis = await get_redis()
    try:
        raw = await redis.get(f"conv:{user_id}")
        if raw:
            import json
            return json.loads(raw)
    except Exception:
        pass
    return []


async def _update_conversation_history(
    user_id: str, user_msg: str, assistant_msg: str
) -> None:
    """Store last 3 turns in Redis with 1-hour TTL."""
    import json
    redis = await get_redis()
    try:
        history = await _get_conversation_history(user_id)
        history.append({"role": "user", "content": user_msg[:500]})
        history.append({"role": "assistant", "content": assistant_msg[:500]})
        history = history[-6:]  # keep last 3 turns
        await redis.setex(f"conv:{user_id}", 3600, json.dumps(history))
    except Exception as e:
        log.warning("conv_history.update_failed", error=str(e))
