"""add last_message_month to workspaces

Revision ID: 5217e936474f
Revises: 002
Create Date: 2026-07-06 15:45:49.893898
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '5217e936474f'
down_revision: Union[str, None] = '002'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add wa_verify_token to bots
    op.add_column('bots', sa.Column('wa_verify_token', sa.Text(), nullable=True))
    # Add last_message_month to workspaces
    op.add_column('workspaces', sa.Column('last_message_month', sa.Integer(), nullable=True))


def downgrade() -> None:
    op.drop_column('workspaces', 'last_message_month')
    op.drop_column('bots', 'wa_verify_token')
