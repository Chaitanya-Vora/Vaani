"""initial schema — all vaani tables

Revision ID: 0001
Revises:
Create Date: 2025-01-01 00:00:00
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = '0001'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # users
    op.create_table('users',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('email', sa.String(255), nullable=True),
        sa.Column('name', sa.String(255), nullable=True),
        sa.Column('business_name', sa.String(500), nullable=True),
        sa.Column('gstin', sa.String(15), nullable=True),
        sa.Column('business_type', sa.String(100), nullable=True),
        sa.Column('language_pref', sa.String(10), nullable=True, server_default='en'),
        sa.Column('whatsapp_number', sa.String(20), nullable=True),
        sa.Column('telegram_chat_id', sa.String(50), nullable=True),
        sa.Column('slack_user_id', sa.String(100), nullable=True),
        sa.Column('hashed_password', sa.String(255), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True, server_default='true'),
        sa.Column('is_verified', sa.Boolean(), nullable=True, server_default='false'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_users_email', 'users', ['email'], unique=True)
    op.create_index('ix_users_whatsapp', 'users', ['whatsapp_number'], unique=True)
    op.create_index('ix_users_telegram', 'users', ['telegram_chat_id'], unique=True)

    # subscriptions
    op.create_table('subscriptions',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('user_id', sa.String(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('plan', sa.String(20), nullable=True, server_default='starter'),
        sa.Column('status', sa.String(20), nullable=True, server_default='trial'),
        sa.Column('razorpay_subscription_id', sa.String(100), nullable=True),
        sa.Column('razorpay_customer_id', sa.String(100), nullable=True),
        sa.Column('tasks_used_this_month', sa.Integer(), nullable=True, server_default='0'),
        sa.Column('current_period_start', sa.DateTime(timezone=True), nullable=True),
        sa.Column('current_period_end', sa.DateTime(timezone=True), nullable=True),
        sa.Column('trial_ends_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id'),
    )

    # user_integrations
    op.create_table('user_integrations',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('user_id', sa.String(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('integration', sa.String(50), nullable=False),
        sa.Column('access_token', sa.Text(), nullable=True),
        sa.Column('refresh_token', sa.Text(), nullable=True),
        sa.Column('token_expires_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('metadata', sa.JSON(), nullable=True, server_default='{}'),
        sa.Column('is_active', sa.Boolean(), nullable=True, server_default='true'),
        sa.Column('connected_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'integration', name='uq_user_integration'),
    )

    # messages
    op.create_table('messages',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('user_id', sa.String(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('channel', sa.String(20), nullable=False),
        sa.Column('message_type', sa.String(20), nullable=False),
        sa.Column('raw_content', sa.Text(), nullable=True),
        sa.Column('transcribed_content', sa.Text(), nullable=True),
        sa.Column('media_url', sa.Text(), nullable=True),
        sa.Column('channel_message_id', sa.String(255), nullable=True),
        sa.Column('processed', sa.Boolean(), nullable=True, server_default='false'),
        sa.Column('received_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('idx_messages_user_received', 'messages', ['user_id', 'received_at'])

    # ai_tasks
    op.create_table('ai_tasks',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('user_id', sa.String(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('source_message_id', sa.String(), sa.ForeignKey('messages.id'), nullable=True),
        sa.Column('intent', sa.String(50), nullable=False),
        sa.Column('status', sa.String(20), nullable=True, server_default='pending'),
        sa.Column('input_text', sa.Text(), nullable=False),
        sa.Column('output_summary', sa.Text(), nullable=True),
        sa.Column('result_data', sa.JSON(), nullable=True, server_default='{}'),
        sa.Column('notion_page_url', sa.Text(), nullable=True),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('tokens_used', sa.Integer(), nullable=True, server_default='0'),
        sa.Column('processing_ms', sa.Integer(), nullable=True, server_default='0'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('idx_ai_tasks_user_created', 'ai_tasks', ['user_id', 'created_at'])

    # memories
    op.create_table('memories',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('user_id', sa.String(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('memory_type', sa.String(50), nullable=False),
        sa.Column('key', sa.String(255), nullable=False),
        sa.Column('value', sa.Text(), nullable=False),
        sa.Column('source_task_id', sa.String(), nullable=True),
        sa.Column('confidence', sa.Integer(), nullable=True, server_default='100'),
        sa.Column('last_referenced', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('idx_memories_user_key', 'memories', ['user_id', 'key'])

    # clients
    op.create_table('clients',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('user_id', sa.String(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('name', sa.String(500), nullable=False),
        sa.Column('company', sa.String(500), nullable=True),
        sa.Column('phone', sa.String(20), nullable=True),
        sa.Column('email', sa.String(255), nullable=True),
        sa.Column('gstin', sa.String(15), nullable=True),
        sa.Column('pan', sa.String(10), nullable=True),
        sa.Column('tags', sa.JSON(), nullable=True, server_default='[]'),
        sa.Column('outstanding_amount', sa.Integer(), nullable=True, server_default='0'),
        sa.Column('last_contacted', sa.DateTime(timezone=True), nullable=True),
        sa.Column('next_followup', sa.DateTime(timezone=True), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('notion_page_id', sa.String(255), nullable=True),
        sa.Column('zoho_contact_id', sa.String(255), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id'),
    )

    # expenses
    op.create_table('expenses',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('user_id', sa.String(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('client_id', sa.String(), sa.ForeignKey('clients.id'), nullable=True),
        sa.Column('amount_paise', sa.Integer(), nullable=False),
        sa.Column('gst_amount_paise', sa.Integer(), nullable=True, server_default='0'),
        sa.Column('category', sa.String(100), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('receipt_url', sa.Text(), nullable=True),
        sa.Column('vendor', sa.String(255), nullable=True),
        sa.Column('expense_date', sa.DateTime(timezone=True), nullable=False),
        sa.Column('tally_synced', sa.Boolean(), nullable=True, server_default='false'),
        sa.Column('notion_page_id', sa.String(255), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'),
    )

    # invoices
    op.create_table('invoices',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('user_id', sa.String(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('client_id', sa.String(), sa.ForeignKey('clients.id'), nullable=True),
        sa.Column('invoice_number', sa.String(50), nullable=False),
        sa.Column('line_items', sa.JSON(), nullable=False),
        sa.Column('subtotal_paise', sa.Integer(), nullable=False),
        sa.Column('gst_paise', sa.Integer(), nullable=False),
        sa.Column('total_paise', sa.Integer(), nullable=False),
        sa.Column('gst_type', sa.String(10), nullable=False),
        sa.Column('status', sa.String(20), nullable=True, server_default='draft'),
        sa.Column('due_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('pdf_url', sa.Text(), nullable=True),
        sa.Column('notion_page_id', sa.String(255), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('paid_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id'),
    )

    # automations
    op.create_table('automations',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('user_id', sa.String(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('instruction', sa.Text(), nullable=False),
        sa.Column('trigger_type', sa.String(30), nullable=False),
        sa.Column('cron_expression', sa.String(100), nullable=True),
        sa.Column('webhook_secret', sa.String(100), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True, server_default='true'),
        sa.Column('last_run_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('run_count', sa.Integer(), nullable=True, server_default='0'),
        sa.Column('error_count', sa.Integer(), nullable=True, server_default='0'),
        sa.Column('last_error', sa.Text(), nullable=True),
        sa.Column('metadata', sa.JSON(), nullable=True, server_default='{}'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'),
    )

    # compliance_reminders
    op.create_table('compliance_reminders',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('user_id', sa.String(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('client_id', sa.String(), sa.ForeignKey('clients.id'), nullable=True),
        sa.Column('compliance_type', sa.String(100), nullable=False),
        sa.Column('due_date', sa.DateTime(timezone=True), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('reminder_sent_3d', sa.Boolean(), nullable=True, server_default='false'),
        sa.Column('reminder_sent_1d', sa.Boolean(), nullable=True, server_default='false'),
        sa.Column('reminder_sent_day', sa.Boolean(), nullable=True, server_default='false'),
        sa.Column('is_completed', sa.Boolean(), nullable=True, server_default='false'),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('period', sa.String(20), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('idx_compliance_user_due', 'compliance_reminders', ['user_id', 'due_date'])


def downgrade() -> None:
    op.drop_table('compliance_reminders')
    op.drop_table('automations')
    op.drop_table('invoices')
    op.drop_table('expenses')
    op.drop_table('clients')
    op.drop_table('memories')
    op.drop_table('ai_tasks')
    op.drop_table('messages')
    op.drop_table('user_integrations')
    op.drop_table('subscriptions')
    op.drop_table('users')
