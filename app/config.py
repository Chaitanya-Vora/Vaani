"""
Central configuration — all secrets via environment variables.
"""

from functools import lru_cache
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # ── App ───────────────────────────────────────────────────────────────────
    APP_NAME: str = "Vaani"
    APP_VERSION: str = "1.0.0"
    ENV: str = "production"
    FRONTEND_URL: str = "https://vaani-nine.vercel.app"
    SECRET_KEY: str = "change-me-in-production-use-openssl-rand-hex-32"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 43200  # 30 days

    # ── Database ──────────────────────────────────────────────────────────────
    DATABASE_URL: str = "postgresql+asyncpg://vaani:vaani@localhost:5432/vaani"
    REDIS_URL: str = "redis://localhost:6379/0"

    # ── AI / LLM ──────────────────────────────────────────────────────────────
    ANTHROPIC_API_KEY: str = ""
    GOOGLE_API_KEY: str = ""          # for Gemini 2.0 Flash-Lite
    OPENAI_API_KEY: str = ""          # for Whisper transcription
    GROQ_API_KEY: str = ""            # for cheap fast classification

    # Claude model routing
    CLAUDE_SMART_MODEL: str = "claude-sonnet-4-5"   # complex drafting
    CLAUDE_FAST_MODEL: str = "claude-haiku-4-5-20251001"    # quick intent classification

    # ── Messaging ─────────────────────────────────────────────────────────────
    # WhatsApp (Meta Cloud API)
    WHATSAPP_PHONE_NUMBER_ID: str = ""
    WHATSAPP_ACCESS_TOKEN: str = ""
    WHATSAPP_VERIFY_TOKEN: str = "vaani_webhook_verify"
    WHATSAPP_WEBHOOK_SECRET: str = ""        # separate from access token — set in Meta dashboard
    WHATSAPP_BUSINESS_ACCOUNT_ID: str = ""

    # Telegram
    TELEGRAM_BOT_TOKEN: str = ""

    # ── Integrations ──────────────────────────────────────────────────────────
    NOTION_CLIENT_ID: str = ""
    NOTION_CLIENT_SECRET: str = ""
    NOTION_REDIRECT_URI: str = "https://vaani-production-01ed.up.railway.app/api/auth/notion/callback"

    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    GOOGLE_REDIRECT_URI: str = "https://vaani-production-01ed.up.railway.app/api/auth/google/callback"

    ZOHO_CLIENT_ID: str = ""
    ZOHO_CLIENT_SECRET: str = ""

    # ── Payments ──────────────────────────────────────────────────────────────
    RAZORPAY_KEY_ID: str = ""
    RAZORPAY_KEY_SECRET: str = ""
    RAZORPAY_WEBHOOK_SECRET: str = ""

    # ── Tier Pricing (INR/month) ──────────────────────────────────────────────
    PLAN_STARTER_PRICE: int = 299
    PLAN_GROWTH_PRICE: int = 799
    PLAN_PRO_PRICE: int = 2499

    # Usage caps per tier (tasks/month)
    PLAN_STARTER_TASKS: int = 50
    PLAN_GROWTH_TASKS: int = 200
    PLAN_PRO_TASKS: int = 999999  # unlimited

    # ── CORS / Security ───────────────────────────────────────────────────────
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "https://vaani.app",
        "https://vaani-nine.vercel.app",
        "https://vaani-nine-chaitanyavoras-projects.vercel.app"
    ]
    ALLOWED_HOSTS: List[str] = ["*"]

    # ── AWS (for data residency — Mumbai) ─────────────────────────────────────
    AWS_ACCESS_KEY_ID: str = ""
    AWS_SECRET_ACCESS_KEY: str = ""
    AWS_REGION: str = "ap-south-1"   # Mumbai
    S3_BUCKET: str = "vaani-uploads"

    # ── Emails ────────────────────────────────────────────────────────────────
    SMTP_HOST: str = "smtp.resend.com"
    SMTP_PORT: int = 465
    SMTP_USER: str = ""
    SMTP_PASS: str = ""
    FROM_EMAIL: str = "hello@vaani.app"


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
