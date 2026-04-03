import asyncio
from app.config import settings
import google.generativeai as genai

if settings.GOOGLE_API_KEY:
    genai.configure(api_key=settings.GOOGLE_API_KEY)

async def run():
    try:
        model = genai.GenerativeModel("gemini-2.0-flash")
        res = await model.generate_content_async("Hello")
        print("Response 2.0-flash:", res.text)
    except Exception as e:
        print("Error 2.0-flash:", e)

    try:
        model = genai.GenerativeModel("gemini-2.0-flash-lite-preview-02-05")
        res = await model.generate_content_async("Hello")
        print("Response lite:", res.text)
    except Exception as e:
        print("Error lite:", e)

    try:
        model = genai.GenerativeModel("gemini-1.5-flash")
        res = await model.generate_content_async("Hello")
        print("Response 1.5-flash:", res.text)
    except Exception as e:
        print("Error 1.5-flash:", e)

asyncio.run(run())
