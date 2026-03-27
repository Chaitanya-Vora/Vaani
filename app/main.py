"""
Vaani — AI Business Assistant for Indian Operators
"Apna business ka AI dimag, WhatsApp pe"
"""

import logging
import time
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
import structlog

from app.config import settings
from app.database import engine, Base
from app.api.routes import auth, webhook, dashboard, automations, billing, health
from app.tasks.celery_app import celery_app  # noqa — ensures Celery is configured


# ── Structured logging ────────────────────────────────────────────────────────
structlog.configure(
    processors=[
        structlog.stdlib.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.JSONRenderer(),
    ],
    wrapper_class=structlog.BoundLogger,
    context_class=dict,
    logger_factory=structlog.PrintLoggerFactory(),
)
log = structlog.get_logger(__name__)


# ── Lifespan ──────────────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    log.info("vaani.startup", version=settings.APP_VERSION, env=settings.ENV)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    log.info("vaani.db_ready")
    yield
    log.info("vaani.shutdown")


# ── App ───────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="Vaani API",
    description="AI Business Assistant for Indian Operators",
    version=settings.APP_VERSION,
    docs_url="/api/docs" if settings.ENV != "production" else None,
    redoc_url=None,
    lifespan=lifespan,
)

# ── Middleware ─────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=settings.ALLOWED_HOSTS,
)


@app.middleware("http")
async def request_logger(request: Request, call_next):
    start = time.perf_counter()
    response = await call_next(request)
    duration_ms = round((time.perf_counter() - start) * 1000, 2)
    log.info(
        "http.request",
        method=request.method,
        path=request.url.path,
        status=response.status_code,
        duration_ms=duration_ms,
    )
    return response


@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    """Basic rate limiting via Redis. 100 req/min per IP."""
    from app.database import get_redis
    if request.url.path.startswith("/api/webhook"):
        try:
            redis = await get_redis()
            ip = request.client.host
            key = f"rl:{ip}"
            count = await redis.incr(key)
            if count == 1:
                await redis.expire(key, 60)
            if count > 200:
                return JSONResponse(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    content={"detail": "Too many requests"},
                )
        except Exception:
            pass  # fail open on Redis errors
    return await call_next(request)


# ── Global exception handler ──────────────────────────────────────────────────
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    log.error("unhandled_exception", path=request.url.path, error=str(exc), exc_info=True)
    
    # Manually apply CORS headers to ensure the browser doesn't block the error
    # with a confusing 'Failed to Fetch' message.
    origin = request.headers.get("origin")
    headers = {}
    if origin and (origin in settings.ALLOWED_ORIGINS or any(origin.endswith(sf) for sf in [".vercel.app", ".localhost"])):
        headers["Access-Control-Allow-Origin"] = origin
        headers["Access-Control-Allow-Credentials"] = "true"

    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Internal server error. The team has been notified."},
        headers=headers,
    )


# ── Routes ────────────────────────────────────────────────────────────────────
app.include_router(health.router, prefix="/api", tags=["health"])
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(webhook.router, prefix="/api/webhook", tags=["webhook"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["dashboard"])
app.include_router(automations.router, prefix="/api/automations", tags=["automations"])
app.include_router(billing.router, prefix="/api/billing", tags=["billing"])
