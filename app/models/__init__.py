"""
Database models — complete schema for all tiers.
"""

import enum
import uuid
from datetime import datetime

from sqlalchemy import (
    Boolean, Column, DateTime, Enum, ForeignKey, Index,
    Integer, JSON, String, Text, UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


def gen_uuid():
    return str(uuid.uuid4())


# ── Enums ─────────────────────────────────────────────────────────────────────

class PlanTier(str, enum.Enum):
    STARTER = "starter"       # ₹299/mo — 50 tasks
    GROWTH = "growth"         # ₹799/mo — 200 tasks
    PRO = "pro"               # ₹2499/mo — unlimited


class PlanStatus(str, enum.Enum):
    TRIAL = "trial"
    ACTIVE = "active"
    PAST_DUE = "past_due"
    CANCELLED = "cancelled"


class MessageChannel(str, enum.Enum):
    WHATSAPP = "whatsapp"
    TELEGRAM = "telegram"
    SLACK = "slack"
    EMAIL = "email"


class MessageType(str, enum.Enum):
    TEXT = "text"
    VOICE = "voice"
    IMAGE = "image"
    DOCUMENT = "document"


class IntentType(str, enum.Enum):
    SAVE_NOTE = "save_note"
    CREATE_TASK = "create_task"
    SET_REMINDER = "set_reminder"
    LOG_MEETING = "log_meeting"
    UPDATE_CRM = "update_crm"
    DRAFT_EMAIL = "draft_email"
    DRAFT_CONTENT = "draft_content"
    LOG_EXPENSE = "log_expense"
    GENERATE_INVOICE = "generate_invoice"
    WEB_SEARCH = "web_search"
    COMPLIANCE_QUERY = "compliance_query"
    AUTOMATION = "automation"
    PAYMENT_FOLLOWUP = "payment_followup"
    COMMITMENT_CAPTURE = "commitment_capture"
    LEAD_CAPTURE = "lead_capture"
    HABIT_LOG = "habit_log"
    IDEA_DUMP = "idea_dump"
    ADD_TASKS = "add_tasks"
    QUERY_IDEAS = "query_ideas"
    SAVE_MEMORY = "save_memory"
    UNKNOWN = "unknown"


class TaskStatus(str, enum.Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"


class UserTaskStatus(str, enum.Enum):
    PENDING = "pending"
    COMPLETED = "completed"


class TaskPriority(str, enum.Enum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class AutomationTrigger(str, enum.Enum):
    RECURRING = "recurring"
    WEBHOOK = "webhook"
    INTEGRATION_EVENT = "integration_event"


class IntegrationName(str, enum.Enum):
    NOTION = "notion"
    GOOGLE_CALENDAR = "google_calendar"
    GMAIL = "gmail"
    ZOHO_CRM = "zoho_crm"
    HUBSPOT = "hubspot"
    TALLY = "tally"
    RAZORPAY = "razorpay"
    LINKEDIN = "linkedin"
    INSTAGRAM = "instagram"


# ── Models ────────────────────────────────────────────────────────────────────

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    email = Column(String(255), unique=True, nullable=True, index=True)
    name = Column(String(255), nullable=True)
    business_name = Column(String(500), nullable=True)
    gstin = Column(String(15), nullable=True)                # GSTIN for invoice generation
    business_type = Column(String(100), nullable=True)       # "startup", "msme", "ca_firm", "aif"
    language_pref = Column(String(10), default="en")         # "en", "hi", "mr", "gu", "ta"
    reply_in_audio = Column(Boolean, default=False)          # Always reply via Voice TTS

    # Messaging channel identities
    whatsapp_number = Column(String(20), unique=True, nullable=True, index=True)
    telegram_chat_id = Column(String(50), unique=True, nullable=True, index=True)
    slack_user_id = Column(String(100), nullable=True)

    # Auth
    hashed_password = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    subscription = relationship("Subscription", back_populates="user", uselist=False)
    messages = relationship("Message", back_populates="user")
    tasks = relationship("AITask", back_populates="user")
    automations = relationship("Automation", back_populates="user")
    integrations = relationship("UserIntegration", back_populates="user")
    memories = relationship("Memory", back_populates="user")
    clients = relationship("Client", back_populates="user")
    expenses = relationship("Expense", back_populates="user")
    invoices = relationship("Invoice", back_populates="user")
    ideas = relationship("Idea", back_populates="user")
    user_tasks = relationship("UserTask", back_populates="user")


class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    user_id = Column(UUID(as_uuid=False), ForeignKey("users.id"), unique=True)
    plan = Column(Enum(PlanTier), default=PlanTier.STARTER)
    status = Column(Enum(PlanStatus), default=PlanStatus.TRIAL)

    # Razorpay
    razorpay_subscription_id = Column(String(100), unique=True, nullable=True)
    razorpay_customer_id = Column(String(100), nullable=True)

    # Usage tracking (resets monthly)
    tasks_used_this_month = Column(Integer, default=0)
    current_period_start = Column(DateTime(timezone=True), nullable=True)
    current_period_end = Column(DateTime(timezone=True), nullable=True)
    trial_ends_at = Column(DateTime(timezone=True), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User", back_populates="subscription")


class UserIntegration(Base):
    __tablename__ = "user_integrations"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    user_id = Column(UUID(as_uuid=False), ForeignKey("users.id"))
    integration = Column(Enum(IntegrationName))
    access_token = Column(Text, nullable=True)          # encrypted at rest
    refresh_token = Column(Text, nullable=True)         # encrypted at rest
    token_expires_at = Column(DateTime(timezone=True), nullable=True)
    metadata_ = Column("metadata", JSON, default=dict)  # workspace_id, bot_id, etc.
    is_active = Column(Boolean, default=True)
    connected_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="integrations")

    __table_args__ = (
        UniqueConstraint("user_id", "integration", name="uq_user_integration"),
    )


class Message(Base):
    """Every inbound message from any channel."""
    __tablename__ = "messages"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    user_id = Column(UUID(as_uuid=False), ForeignKey("users.id"), index=True)
    channel = Column(Enum(MessageChannel))
    message_type = Column(Enum(MessageType))
    raw_content = Column(Text, nullable=True)           # original text
    transcribed_content = Column(Text, nullable=True)   # if voice → text
    media_url = Column(Text, nullable=True)             # S3 URL for voice/image
    channel_message_id = Column(String(255), nullable=True)  # WhatsApp message ID
    processed = Column(Boolean, default=False)
    received_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="messages")
    ai_task = relationship("AITask", back_populates="source_message", uselist=False)

    __table_args__ = (
        Index("idx_messages_user_received", "user_id", "received_at"),
    )


class AITask(Base):
    """Represents one AI-processed action."""
    __tablename__ = "ai_tasks"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    user_id = Column(UUID(as_uuid=False), ForeignKey("users.id"), index=True)
    source_message_id = Column(UUID(as_uuid=False), ForeignKey("messages.id"), nullable=True)
    intent = Column(Enum(IntentType))
    status = Column(Enum(TaskStatus), default=TaskStatus.PENDING)
    input_text = Column(Text)
    output_summary = Column(Text, nullable=True)       # what was done
    result_data = Column(JSON, default=dict)            # structured output
    notion_page_url = Column(Text, nullable=True)
    error_message = Column(Text, nullable=True)
    tokens_used = Column(Integer, default=0)
    processing_ms = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)

    user = relationship("User", back_populates="tasks")
    source_message = relationship("Message", back_populates="ai_task")

    __table_args__ = (
        Index("idx_ai_tasks_user_created", "user_id", "created_at"),
    )


class Memory(Base):
    """Long-term memory per user — key facts the AI remembers."""
    __tablename__ = "memories"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    user_id = Column(UUID(as_uuid=False), ForeignKey("users.id"), index=True)
    memory_type = Column(String(50))   # "client", "preference", "fact", "context"
    key = Column(String(255))
    value = Column(Text)
    source_task_id = Column(UUID(as_uuid=False), nullable=True)
    confidence = Column(Integer, default=100)   # 0-100
    last_referenced = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="memories")

    __table_args__ = (
        Index("idx_memories_user_key", "user_id", "key"),
    )


class Client(Base):
    """CRM — clients the user manages."""
    __tablename__ = "clients"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    user_id = Column(UUID(as_uuid=False), ForeignKey("users.id"), index=True)
    name = Column(String(500))
    company = Column(String(500), nullable=True)
    phone = Column(String(20), nullable=True)
    email = Column(String(255), nullable=True)
    gstin = Column(String(15), nullable=True)
    pan = Column(String(10), nullable=True)
    tags = Column(JSON, default=list)                       # ["vip", "gst_client"]
    outstanding_amount = Column(Integer, default=0)         # in paise
    last_contacted = Column(DateTime(timezone=True), nullable=True)
    next_followup = Column(DateTime(timezone=True), nullable=True)
    notes = Column(Text, nullable=True)
    notion_page_id = Column(String(255), nullable=True)
    zoho_contact_id = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User", back_populates="clients")
    expenses = relationship("Expense", back_populates="client")
    invoices = relationship("Invoice", back_populates="client")


class Expense(Base):
    __tablename__ = "expenses"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    user_id = Column(UUID(as_uuid=False), ForeignKey("users.id"), index=True)
    client_id = Column(UUID(as_uuid=False), ForeignKey("clients.id"), nullable=True)
    amount_paise = Column(Integer)          # amount in paise (INR × 100)
    gst_amount_paise = Column(Integer, default=0)
    category = Column(String(100))          # "travel", "office", "software", "meals"
    description = Column(Text)
    receipt_url = Column(Text, nullable=True)   # S3
    vendor = Column(String(255), nullable=True)
    expense_date = Column(DateTime(timezone=True))
    tally_synced = Column(Boolean, default=False)
    notion_page_id = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="expenses")
    client = relationship("Client", back_populates="expenses")


class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    user_id = Column(UUID(as_uuid=False), ForeignKey("users.id"), index=True)
    client_id = Column(UUID(as_uuid=False), ForeignKey("clients.id"), nullable=True)
    invoice_number = Column(String(50))     # VAA-2024-001
    line_items = Column(JSON)               # [{desc, qty, rate, gst_rate}]
    subtotal_paise = Column(Integer)
    gst_paise = Column(Integer)
    total_paise = Column(Integer)
    gst_type = Column(String(10))           # "IGST", "CGST+SGST"
    status = Column(String(20), default="draft")   # draft, sent, paid, overdue
    due_date = Column(DateTime(timezone=True), nullable=True)
    pdf_url = Column(Text, nullable=True)   # S3
    notion_page_id = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    paid_at = Column(DateTime(timezone=True), nullable=True)

    user = relationship("User", back_populates="invoices")
    client = relationship("Client", back_populates="invoices")


class Automation(Base):
    """Recurring or webhook-triggered automations."""
    __tablename__ = "automations"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    user_id = Column(UUID(as_uuid=False), ForeignKey("users.id"), index=True)
    name = Column(String(255))
    instruction = Column(Text)              # natural language instruction
    trigger_type = Column(Enum(AutomationTrigger))
    cron_expression = Column(String(100), nullable=True)    # for recurring
    webhook_secret = Column(String(100), nullable=True)     # for webhook triggers
    is_active = Column(Boolean, default=True)
    last_run_at = Column(DateTime(timezone=True), nullable=True)
    run_count = Column(Integer, default=0)
    error_count = Column(Integer, default=0)
    last_error = Column(Text, nullable=True)
    metadata_ = Column("metadata", JSON, default=dict)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="automations")


class ComplianceReminder(Base):
    """Tracks India compliance deadlines per user."""
    __tablename__ = "compliance_reminders"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    user_id = Column(UUID(as_uuid=False), ForeignKey("users.id"), index=True)
    client_id = Column(UUID(as_uuid=False), ForeignKey("clients.id"), nullable=True)
    compliance_type = Column(String(100))   # "gstr1", "gstr3b", "advance_tax_q1", etc.
    due_date = Column(DateTime(timezone=True))
    description = Column(Text)
    reminder_sent_3d = Column(Boolean, default=False)   # 3 days before
    reminder_sent_1d = Column(Boolean, default=False)   # 1 day before
    reminder_sent_day = Column(Boolean, default=False)  # same day
    is_completed = Column(Boolean, default=False)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    period = Column(String(20), nullable=True)          # "Oct 2024", "Q2 FY25"
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        Index("idx_compliance_user_due", "user_id", "due_date"),
    )

class Idea(Base):
    """Organic Idea Organizer backend."""
    __tablename__ = "ideas"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    user_id = Column(UUID(as_uuid=False), ForeignKey("users.id"), index=True)
    content = Column(Text)
    category = Column(String(100), nullable=True)
    notion_page_id = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="ideas")


class UserTask(Base):
    """Personal/Professional task priority manager."""
    __tablename__ = "user_tasks"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    user_id = Column(UUID(as_uuid=False), ForeignKey("users.id"), index=True)
    description = Column(Text)
    priority = Column(Enum(TaskPriority), default=TaskPriority.MEDIUM)
    status = Column(Enum(UserTaskStatus), default=UserTaskStatus.PENDING)
    due_date = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)

    user = relationship("User", back_populates="user_tasks")
