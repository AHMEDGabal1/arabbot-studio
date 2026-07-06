"""add supabase_uid to users

Revision ID: 002
Revises: 001
Create Date: 2026-07-05
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "002"
down_revision: Union[str, None] = "001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table("users") as batch_op:
        batch_op.add_column(sa.Column("supabase_uid", sa.String(255), nullable=True))
        batch_op.create_unique_constraint("uq_users_supabase_uid", ["supabase_uid"])
        batch_op.alter_column("password_hash", type_=sa.Text(), nullable=True)


def downgrade() -> None:
    with op.batch_alter_table("users") as batch_op:
        batch_op.drop_constraint("uq_users_supabase_uid", type_="unique")
        batch_op.drop_column("supabase_uid")
        batch_op.alter_column("password_hash", type_=sa.Text(), nullable=False)
