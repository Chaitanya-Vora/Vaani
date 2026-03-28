import os
import uuid
import structlog
from google.cloud import texttospeech
from app.config import settings

log = structlog.get_logger(__name__)

# Constants for Voice Quality
VOICE_NAME_HINDI = "hi-IN-Neural2-A"
VOICE_NAME_ENGLISH = "en-IN-Neural2-A"
LANGUAGE_CODE_HINDI = "hi-IN"
LANGUAGE_CODE_ENGLISH = "en-IN"

def generate_voice_response(text: str, language: str = "hi") -> str:
    """
    Converts text to an AI voice note (MP3/OGG).
    Returns the absolute path to the generated file.
    """
    try:
        # 1. Initialize Client with API Key
        # Note: google-cloud-texttospeech supports API Key via client_options
        client = texttospeech.TextToSpeechClient(
            client_options={"api_key": settings.GOOGLE_API_KEY}
        )

        # 2. Select Synthesis Input
        synthesis_input = texttospeech.SynthesisInput(text=text)

        # 3. Build Voice Selection Params
        # If Hindi or 'hi', use Hindi Neural2, else use English (India) Neural2
        lang_code = LANGUAGE_CODE_HINDI if language == "hi" else LANGUAGE_CODE_ENGLISH
        voice_name = VOICE_NAME_HINDI if language == "hi" else VOICE_NAME_ENGLISH

        voice = texttospeech.VoiceSelectionParams(
            language_code=lang_code,
            name=voice_name
        )

        # 4. Select Audio Config
        # MP3 is safe and easy to stream/clean up
        audio_config = texttospeech.AudioConfig(
            audio_encoding=texttospeech.AudioEncoding.MP3,
            pitch=0,
            speaking_rate=1.05 # Slightly faster for professional feel
        )

        # 5. Execute Synthesis
        response = client.synthesize_speech(
            input=synthesis_input, voice=voice, audio_config=audio_config
        )

        # 6. Save to Temporary File in Workspace
        temp_dir = os.path.join(os.getcwd(), "temp_voice")
        if not os.path.exists(temp_dir):
            os.makedirs(temp_dir)

        filename = f"vaani_{uuid.uuid4().hex}.mp3"
        filepath = os.path.join(temp_dir, filename)

        with open(filepath, "wb") as out:
            out.write(response.audio_content)
            log.info("tts.generated", path=filepath, chars=len(text))

        return filepath

    except Exception as e:
        log.error("tts.error", error=str(e))
        return None

def cleanup_voice_file(filepath: str):
    """Safely delete the temp audio file."""
    try:
        if filepath and os.path.exists(filepath):
            os.remove(filepath)
            log.info("tts.cleanup", path=filepath)
    except Exception as e:
        log.warning("tts.cleanup_failed", error=str(e))
