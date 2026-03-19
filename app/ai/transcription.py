"""
Voice transcription via OpenAI Whisper.
Supports Hindi, Marathi, Gujarati, Tamil, Telugu, English.
"""

import asyncio
import time
import tempfile
import os
from typing import Optional

import httpx
import structlog
from openai import AsyncOpenAI

from app.config import settings

log = structlog.get_logger(__name__)

# Language codes Whisper supports (Indian languages)
INDIAN_LANGUAGES = {
    "hi": "hindi",
    "mr": "marathi",
    "gu": "gujarati",
    "ta": "tamil",
    "te": "telugu",
    "kn": "kannada",
    "ml": "malayalam",
    "bn": "bengali",
    "pa": "punjabi",
    "en": "english",
}

openai_client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)


async def transcribe_audio(
    audio_url: str,
    language_hint: Optional[str] = None,
    user_id: Optional[str] = None,
) -> dict:
    """
    Download audio from URL and transcribe with Whisper.
    Returns: {text, language, duration_seconds, confidence}
    """
    start = time.perf_counter()

    try:
        # Download audio
        audio_bytes = await _download_audio(audio_url)
        if not audio_bytes:
            return {"error": "Could not download audio", "text": ""}

        # Write to temp file (Whisper needs a file object)
        with tempfile.NamedTemporaryFile(suffix=".ogg", delete=False) as tmp:
            tmp.write(audio_bytes)
            tmp_path = tmp.name

        try:
            transcription = await openai_client.audio.transcriptions.create(
                model="whisper-1",
                file=open(tmp_path, "rb"),
                language=language_hint,         # None = auto-detect
                response_format="verbose_json", # gives us language + duration
                temperature=0.0,                # deterministic
            )
        finally:
            os.unlink(tmp_path)

        elapsed = round((time.perf_counter() - start) * 1000)
        detected_lang = getattr(transcription, "language", "en")

        log.info(
            "transcription.complete",
            user_id=user_id,
            language=detected_lang,
            duration_sec=getattr(transcription, "duration", 0),
            processing_ms=elapsed,
        )

        return {
            "text": transcription.text.strip(),
            "language": detected_lang,
            "duration_seconds": getattr(transcription, "duration", 0),
            "processing_ms": elapsed,
        }

    except Exception as e:
        log.error("transcription.error", error=str(e), user_id=user_id)
        return {"error": str(e), "text": ""}


async def _download_audio(url: str) -> Optional[bytes]:
    """Download audio bytes from URL (WhatsApp media URL or S3)."""
    headers = {}

    # WhatsApp media URLs need auth
    if "graph.facebook.com" in url or "whatsapp" in url.lower():
        headers["Authorization"] = f"Bearer {settings.WHATSAPP_ACCESS_TOKEN}"

    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            response = await client.get(url, headers=headers, follow_redirects=True)
            response.raise_for_status()
            return response.content
        except Exception as e:
            log.error("audio_download.error", url=url, error=str(e))
            return None
