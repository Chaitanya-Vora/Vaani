import asyncio
import sys
import os

# Add parent dir to path so we can import app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.config import settings
from telegram import Bot

async def setup_webhook(base_url: str):
    """
    Sets the Telegram webhook to {base_url}/api/webhook/telegram
    """
    token = settings.TELEGRAM_BOT_TOKEN
    if not token:
        print("❌ TELEGRAM_BOT_TOKEN not found in settings!")
        return

    bot = Bot(token)
    webhook_url = f"{base_url.rstrip('/')}/api/webhook/telegram"
    
    print(f"🔄 Setting Telegram webhook to: {webhook_url}...")
    
    success = await bot.set_webhook(url=webhook_url)
    if success:
        print("✅ Telegram Webhook set successfully!")
        info = await bot.get_webhook_info()
        print(f"ℹ️ Webhook Info: {info}")
    else:
        print("❌ Failed to set Telegram Webhook.")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python scripts/setup_telegram.py <YOUR_BACKEND_URL>")
        print("Example: python scripts/setup_telegram.py https://vaani-api.railway.app")
        sys.exit(1)
    
    backend_url = sys.argv[1]
    asyncio.run(setup_webhook(backend_url))
