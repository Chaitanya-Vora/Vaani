"""
Telegram Bot handler using python-telegram-bot (PTB v20 async).
Great for development/testing before WhatsApp approval.
"""

from __future__ import annotations
import structlog
from telegram import Update, Bot
from telegram.ext import (
    Application, CommandHandler, MessageHandler,
    ContextTypes, filters,
)
from telegram.constants import ParseMode, ChatAction

from app.config import settings

log = structlog.get_logger(__name__)

_bot_app: Application | None = None


def get_telegram_app() -> Application:
    global _bot_app
    if _bot_app is None:
        _bot_app = (
            Application.builder()
            .token(settings.TELEGRAM_BOT_TOKEN)
            .build()
        )
        _bot_app.add_handler(CommandHandler("start", _cmd_start))
        _bot_app.add_handler(CommandHandler("help", _cmd_help))
        _bot_app.add_handler(CommandHandler("status", _cmd_status))
        _bot_app.add_handler(CommandHandler("compliance", _cmd_compliance))
        _bot_app.add_handler(MessageHandler(filters.VOICE | filters.AUDIO, _handle_voice))
        _bot_app.add_handler(MessageHandler(filters.PHOTO, _handle_image))
        _bot_app.add_handler(MessageHandler(filters.Document.ALL, _handle_document))
        _bot_app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, _handle_text))
    return _bot_app


def parse_telegram_update(payload: dict) -> dict:
    """Parse raw Telegram webhook payload into normalized message dict."""
    update = Update.de_json(payload, Bot(settings.TELEGRAM_BOT_TOKEN))

    msg = update.message or update.edited_message
    if not msg:
        return {}

    parsed = {
        "channel": "telegram",
        "telegram_chat_id": str(msg.chat.id),
        "from_name": msg.from_user.first_name if msg.from_user else "",
        "message_id": str(msg.message_id),
        "type": "text",
        "text": None,
        "audio_url": None,
        "image_url": None,
        "document_url": None,
    }

    if msg.text:
        parsed["text"] = msg.text
        parsed["type"] = "text"
    elif msg.voice:
        parsed["type"] = "voice"
        parsed["media_file_id"] = msg.voice.file_id
    elif msg.audio:
        parsed["type"] = "audio"
        parsed["media_file_id"] = msg.audio.file_id
    elif msg.photo:
        parsed["type"] = "image"
        parsed["media_file_id"] = msg.photo[-1].file_id  # largest size
        parsed["caption"] = msg.caption or ""
    elif msg.document:
        parsed["type"] = "document"
        parsed["media_file_id"] = msg.document.file_id
        parsed["filename"] = msg.document.file_name or "file"

    return parsed


async def send_telegram_message(chat_id: str, text: str) -> bool:
    """Send message via Telegram Bot API."""
    bot = Bot(settings.TELEGRAM_BOT_TOKEN)
    # Truncate if needed (Telegram limit: 4096)
    if len(text) > 4000:
        text = text[:3990] + "\n\n_...saved in full to Notion_"
    try:
        await bot.send_message(
            chat_id=chat_id,
            text=text,
            parse_mode=ParseMode.MARKDOWN,
        )
        return True
    except Exception as e:
        log.error("telegram.send_error", chat_id=chat_id, error=str(e))
        return False


async def get_telegram_file_url(file_id: str) -> str | None:
    """Get download URL for a Telegram file."""
    bot = Bot(settings.TELEGRAM_BOT_TOKEN)
    try:
        file = await bot.get_file(file_id)
        return file.file_path  # Full URL
    except Exception as e:
        log.error("telegram.file_url_error", file_id=file_id, error=str(e))
        return None


# ── Command Handlers ──────────────────────────────────────────────────────────

async def _cmd_start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(
        "🙏 *Namaste! Main Vaani hoon — apka AI business assistant.*\n\n"
        "Main kar sakta hoon:\n"
        "🎙️ Voice notes → structured Notion pages\n"
        "✅ Tasks, reminders, meeting minutes\n"
        "📊 GST/TDS deadline alerts\n"
        "💼 Client CRM updates\n"
        "📄 GST invoice generation\n\n"
        "Bas bolo ya type karo — main handle kar leta hoon.\n\n"
        "To connect Notion & other apps: vaani.app/connect",
        parse_mode=ParseMode.MARKDOWN,
    )


async def _cmd_help(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(
        "*Vaani Commands*\n\n"
        "Just send any voice note or text message and I'll figure out what to do.\n\n"
        "*Examples:*\n"
        "• _'Just finished call with Mehta ji, he wants proposal by Friday'_\n"
        "• _'₹4500 petrol bill from today, tag under travel'_\n"
        "• _'Remind me about GSTR-3B on the 18th'_\n"
        "• _'Draft invoice for ABC Corp, ₹45000 + 18% GST'_\n"
        "• _'When is advance tax Q2 due?'_\n\n"
        "/status — Your usage this month\n"
        "/compliance — Upcoming deadlines\n\n"
        "_vaani.app — connect your apps_",
        parse_mode=ParseMode.MARKDOWN,
    )


async def _cmd_status(update: Update, context: ContextTypes.DEFAULT_TYPE):
    # Placeholder — actual implementation fetches from DB
    await update.message.reply_text(
        "📊 *Your Vaani Status*\n\n"
        "Plan: Starter (₹299/mo)\n"
        "Tasks used: 12/50 this month\n"
        "Connected: Notion ✅ | Google Calendar ✅\n\n"
        "_Upgrade for more tasks: vaani.app/upgrade_",
        parse_mode=ParseMode.MARKDOWN,
    )


async def _cmd_compliance(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Show upcoming Indian compliance deadlines."""
    from app.compliance.india_calendar import get_upcoming_deadlines_text
    text = get_upcoming_deadlines_text()
    await update.message.reply_text(text, parse_mode=ParseMode.MARKDOWN)


async def _handle_voice(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Show typing while processing voice."""
    await update.message.chat.send_action(ChatAction.TYPING)
    # Route to message_router — Telegram update will be caught by webhook route


async def _handle_image(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.chat.send_action(ChatAction.TYPING)


async def _handle_document(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.chat.send_action(ChatAction.TYPING)


async def _handle_text(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.chat.send_action(ChatAction.TYPING)
