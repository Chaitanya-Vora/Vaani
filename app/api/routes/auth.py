"""
Auth routes — user registration, login, OAuth flows for Notion/Google.
"""

from datetime import datetime, timezone, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel, EmailStr
import bcrypt
import httpx
import jwt
import structlog

from app.config import settings
from app.database import get_db
from app.models import User, Subscription, UserIntegration, PlanTier, IntegrationName
from app.integrations.notion import setup_vaani_workspace

router = APIRouter()
log = structlog.get_logger(__name__)


# ── Schemas ───────────────────────────────────────────────────────────────────

class SignupRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    business_name: str
    business_type: str = "msme"         # msme | startup | ca_firm | aif | pms
    whatsapp_number: Optional[str] = None
    gstin: Optional[str] = None
    language_pref: str = "en"


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    name: str


# ── JWT helpers ───────────────────────────────────────────────────────────────

def create_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=settings.JWT_EXPIRE_MINUTES),
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def decode_token(token: str) -> str:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        return payload["sub"]
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


# ── Routes ────────────────────────────────────────────────────────────────────

@router.post("/signup", response_model=TokenResponse, status_code=201)
async def signup(body: SignupRequest, db: AsyncSession = Depends(get_db)):
    # Check email uniqueness
    result = await db.execute(select(User).where(User.email == body.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Email already registered")

    # Hash password
    pw_hash = bcrypt.hashpw(body.password.encode(), bcrypt.gensalt()).decode()

    user = User(
        name=body.name,
        email=body.email,
        hashed_password=pw_hash,
        business_name=body.business_name,
        business_type=body.business_type,
        whatsapp_number=body.whatsapp_number,
        gstin=body.gstin,
        language_pref=body.language_pref,
        is_active=True,
    )
    db.add(user)
    await db.flush()

    # Trial subscription
    sub = Subscription(
        user_id=user.id,
        plan=PlanTier.STARTER,
        status="trial",
        trial_ends_at=datetime.now(timezone.utc) + timedelta(days=7),
        current_period_start=datetime.now(timezone.utc),
        tasks_used_this_month=0,
    )
    db.add(sub)
    await db.flush()

    token = create_token(str(user.id))
    log.info("user.signup", user_id=str(user.id), business=body.business_name)

    return TokenResponse(access_token=token, user_id=str(user.id), name=user.name)


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()

    if not user or not bcrypt.checkpw(body.password.encode(), user.hashed_password.encode()):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account deactivated")

    token = create_token(str(user.id))
    return TokenResponse(access_token=token, user_id=str(user.id), name=user.name)


# ── Notion OAuth ──────────────────────────────────────────────────────────────

@router.get("/notion/connect")
async def notion_connect_start(request: Request):
    """Redirect to Notion OAuth."""
    params = f"client_id={settings.NOTION_CLIENT_ID}&response_type=code&owner=user&redirect_uri={settings.NOTION_REDIRECT_URI}"
    return RedirectResponse(f"https://api.notion.com/v1/oauth/authorize?{params}")


@router.get("/notion/callback")
async def notion_callback(code: str, state: Optional[str] = None, db: AsyncSession = Depends(get_db)):
    """Handle Notion OAuth callback, set up workspace."""
    if not code:
        raise HTTPException(status_code=400, detail="Missing code")

    # Exchange code for token
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            "https://api.notion.com/v1/oauth/token",
            auth=(settings.NOTION_CLIENT_ID, settings.NOTION_CLIENT_SECRET),
            json={
                "grant_type": "authorization_code",
                "code": code,
                "redirect_uri": settings.NOTION_REDIRECT_URI,
            },
        )
        if resp.status_code != 200:
            raise HTTPException(status_code=400, detail="Notion OAuth failed")
        token_data = resp.json()

    access_token = token_data.get("access_token")
    workspace_id = token_data.get("workspace_id")
    workspace_name = token_data.get("workspace_name", "")
    bot_id = token_data.get("bot_id")
    owner = token_data.get("owner", {})

    # Find user by state (JWT) or owner email
    user_id = state  # We pass user_id as state in the OAuth URL
    if not user_id:
        raise HTTPException(status_code=400, detail="No user context in state")

    # Setup the Vaani Second Brain workspace in their Notion
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    workspace_meta = await setup_vaani_workspace(
        access_token=access_token,
        business_name=user.business_name or "My Business",
    )
    workspace_meta["workspace_id"] = workspace_id
    workspace_meta["bot_id"] = bot_id

    # Save integration
    result2 = await db.execute(
        select(UserIntegration).where(
            UserIntegration.user_id == user_id,
            UserIntegration.integration == IntegrationName.NOTION,
        )
    )
    existing = result2.scalar_one_or_none()
    if existing:
        existing.access_token = access_token
        existing.metadata_ = workspace_meta
        existing.is_active = True
    else:
        db.add(UserIntegration(
            user_id=user_id,
            integration=IntegrationName.NOTION,
            access_token=access_token,
            metadata_=workspace_meta,
        ))
    await db.flush()

    # Seed compliance reminders into Notion
    from app.compliance.india_calendar import seed_user_compliance_reminders
    count = await seed_user_compliance_reminders(
        user_id=user_id,
        business_type=user.business_type or "msme",
        notion_access_token=access_token,
        workspace_meta=workspace_meta,
        db=db,
    )

    log.info("notion.connected", user_id=user_id, workspace=workspace_name, compliance_entries=count)
    return RedirectResponse(f"{settings.ALLOWED_ORIGINS[0]}/dashboard?notion=connected")


# ── Google OAuth ──────────────────────────────────────────────────────────────

@router.get("/google/connect")
async def google_connect(state: Optional[str] = None):
    scopes = "https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/tasks"
    params = (
        f"client_id={settings.GOOGLE_CLIENT_ID}"
        f"&redirect_uri={settings.GOOGLE_REDIRECT_URI}"
        f"&response_type=code"
        f"&scope={scopes}"
        f"&access_type=offline"
        f"&prompt=consent"
        f"&state={state or ''}"
    )
    return RedirectResponse(f"https://accounts.google.com/o/oauth2/v2/auth?{params}")


@router.get("/google/callback")
async def google_callback(
    code: str,
    state: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            "https://oauth2.googleapis.com/token",
            data={
                "code": code,
                "client_id": settings.GOOGLE_CLIENT_ID,
                "client_secret": settings.GOOGLE_CLIENT_SECRET,
                "redirect_uri": settings.GOOGLE_REDIRECT_URI,
                "grant_type": "authorization_code",
            },
        )
        if resp.status_code != 200:
            raise HTTPException(status_code=400, detail="Google OAuth failed")
        token_data = resp.json()

    user_id = state
    if not user_id:
        raise HTTPException(status_code=400, detail="No user context")

    from datetime import timedelta
    expires_at = datetime.now(timezone.utc) + timedelta(seconds=token_data.get("expires_in", 3600))

    # Save both calendar and Gmail with one token set
    for integration_name in [IntegrationName.GOOGLE_CALENDAR, IntegrationName.GMAIL]:
        result = await db.execute(
            select(UserIntegration).where(
                UserIntegration.user_id == user_id,
                UserIntegration.integration == integration_name,
            )
        )
        existing = result.scalar_one_or_none()
        if existing:
            existing.access_token = token_data.get("access_token")
            existing.refresh_token = token_data.get("refresh_token")
            existing.token_expires_at = expires_at
            existing.is_active = True
        else:
            db.add(UserIntegration(
                user_id=user_id,
                integration=integration_name,
                access_token=token_data.get("access_token"),
                refresh_token=token_data.get("refresh_token"),
                token_expires_at=expires_at,
            ))

    await db.flush()
    log.info("google.connected", user_id=user_id)
    return RedirectResponse(f"{settings.ALLOWED_ORIGINS[0]}/dashboard?google=connected")
