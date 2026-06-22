"""initial migration

Revision ID: 001
Revises:
Create Date: 2026-04-21
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("phone", sa.String(20), nullable=True),
        sa.Column("password_hash", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("email"),
    )
    op.create_table(
        "workspaces",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("name", sa.Text(), nullable=False),
        sa.Column("plan", sa.String(20), server_default="starter"),
        sa.Column("monthly_message_limit", sa.Integer(), server_default="1000"),
        sa.Column("messages_used_this_month", sa.Integer(), server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "workspace_members",
        sa.Column("workspace_id", sa.UUID(), nullable=False),
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("role", sa.String(20), server_default="member"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"],),
        sa.ForeignKeyConstraint(["workspace_id"], ["workspaces.id"],),
        sa.PrimaryKeyConstraint("workspace_id", "user_id"),
    )
    op.create_table(
        "bots",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("workspace_id", sa.UUID(), nullable=False),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("language", sa.String(10), server_default="ar-EG"),
        sa.Column("channel", sa.String(20), nullable=False),
        sa.Column("wa_phone_number_id", sa.Text(), nullable=True),
        sa.Column("wa_access_token", sa.Text(), nullable=True),
        sa.Column("fb_page_id", sa.Text(), nullable=True),
        sa.Column("fb_access_token", sa.Text(), nullable=True),
        sa.Column("system_prompt", sa.Text(), nullable=True),
        sa.Column("fallback_message", sa.Text(), server_default="هورينك لحد من فريقنا دلوقتي"),
        sa.Column("human_handoff_enabled", sa.Boolean(), server_default="true"),
        sa.Column("fawry_merchant_code", sa.Text(), nullable=True),
        sa.Column("paymob_api_key", sa.Text(), nullable=True),
        sa.Column("is_active", sa.Boolean(), server_default="false"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["workspace_id"], ["workspaces.id"],),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "conversations",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("bot_id", sa.UUID(), nullable=False),
        sa.Column("channel", sa.String(20), nullable=False),
        sa.Column("channel_user_id", sa.Text(), nullable=False),
        sa.Column("user_display_name", sa.Text(), nullable=True),
        sa.Column("status", sa.String(20), server_default="active"),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("last_message_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["bot_id"], ["bots.id"],),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "knowledge_items",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("bot_id", sa.UUID(), nullable=False),
        sa.Column("type", sa.Text(), nullable=False),
        sa.Column("question", sa.Text(), nullable=True),
        sa.Column("answer", sa.Text(), nullable=False),
        sa.Column("metadata", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["bot_id"], ["bots.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "messages",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("conversation_id", sa.UUID(), nullable=False),
        sa.Column("role", sa.String(20), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("raw_content", sa.Text(), nullable=True),
        sa.Column("intent_detected", sa.String(50), nullable=True),
        sa.Column("confidence", sa.Float(), nullable=True),
        sa.Column("was_rag_hit", sa.Boolean(), server_default="false"),
        sa.Column("processing_ms", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["conversation_id"], ["conversations.id"],),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "handoff_queue",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("conversation_id", sa.UUID(), nullable=False),
        sa.Column("reason", sa.Text(), nullable=True),
        sa.Column("assigned_to", sa.UUID(), nullable=True),
        sa.Column("resolved_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["assigned_to"], ["users.id"],),
        sa.ForeignKeyConstraint(["conversation_id"], ["conversations.id"],),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("idx_workspace_members_workspace", "workspace_members", ["workspace_id"])
    op.create_index("idx_workspace_members_user", "workspace_members", ["user_id"])
    op.create_index("idx_bots_workspace", "bots", ["workspace_id", "deleted_at"])
    op.create_index("idx_conversations_bot", "conversations", ["bot_id", "status"])
    op.create_index("idx_messages_conversation", "messages", ["conversation_id"])
    op.create_index("idx_knowledge_bot", "knowledge_items", ["bot_id"])


def downgrade() -> None:
    op.drop_table("handoff_queue")
    op.drop_table("messages")
    op.drop_table("knowledge_items")
    op.drop_table("conversations")
    op.drop_table("bots")
    op.drop_table("workspace_members")
    op.drop_table("workspaces")
    op.drop_table("users")
