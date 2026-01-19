"""Create transactions table.

Revision ID: 003_transactions
Revises: 002_customers_accounts
Create Date: 2026-01-16

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "003_transactions"
down_revision: Union[str, None] = "002_customers_accounts"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create transactions table
    op.create_table(
        "transactions",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("reference", sa.String(30), unique=True, index=True, nullable=False),
        sa.Column(
            "account_id",
            sa.Integer(),
            sa.ForeignKey("accounts.id", ondelete="RESTRICT"),
            nullable=False,
            index=True,
        ),
        sa.Column(
            "transaction_type",
            sa.Enum(
                "deposit",
                "withdrawal",
                "transfer_in",
                "transfer_out",
                name="transaction_type",
            ),
            nullable=False,
        ),
        sa.Column("amount", sa.Numeric(precision=15, scale=2), nullable=False),
        sa.Column("balance_after", sa.Numeric(precision=15, scale=2), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
    )

    # Create index for efficient date range queries
    op.create_index(
        "ix_transactions_account_created",
        "transactions",
        ["account_id", "created_at"],
    )


def downgrade() -> None:
    op.drop_index("ix_transactions_account_created", table_name="transactions")
    op.drop_table("transactions")
