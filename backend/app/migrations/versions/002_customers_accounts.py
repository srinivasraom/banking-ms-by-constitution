"""Create customers and accounts tables.

Revision ID: 002_customers_accounts
Revises: 001_enums
Create Date: 2026-01-16

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "002_customers_accounts"
down_revision: Union[str, None] = "001_enums"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create customers table
    op.create_table(
        "customers",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column(
            "customer_id", sa.String(20), unique=True, index=True, nullable=False
        ),
        sa.Column("email", sa.String(255), unique=True, index=True, nullable=False),
        sa.Column("password_hash", sa.String(255), nullable=False),
        sa.Column("first_name", sa.String(100), nullable=False),
        sa.Column("last_name", sa.String(100), nullable=False),
        sa.Column("phone", sa.String(20), nullable=False),
        sa.Column("date_of_birth", sa.Date(), nullable=False),
        sa.Column("address_line1", sa.String(255), nullable=False),
        sa.Column("address_line2", sa.String(255), nullable=True),
        sa.Column("city", sa.String(100), nullable=False),
        sa.Column("state", sa.String(100), nullable=False),
        sa.Column("postal_code", sa.String(20), nullable=False),
        sa.Column("country", sa.String(2), nullable=False, server_default="US"),
        sa.Column(
            "status",
            sa.Enum("active", "inactive", "suspended", name="customer_status"),
            nullable=False,
            server_default="active",
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
    )

    # Create accounts table
    op.create_table(
        "accounts",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column(
            "account_number", sa.String(16), unique=True, index=True, nullable=False
        ),
        sa.Column(
            "customer_id",
            sa.Integer(),
            sa.ForeignKey("customers.id", ondelete="RESTRICT"),
            nullable=False,
            index=True,
        ),
        sa.Column(
            "account_type",
            sa.Enum("checking", "savings", name="account_type"),
            nullable=False,
        ),
        sa.Column(
            "status",
            sa.Enum("active", "inactive", "closed", "frozen", name="account_status"),
            nullable=False,
            server_default="active",
        ),
        sa.Column(
            "balance",
            sa.Numeric(precision=15, scale=2),
            nullable=False,
            server_default="0.00",
        ),
        sa.Column("nickname", sa.String(100), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column("closed_at", sa.DateTime(timezone=True), nullable=True),
        sa.CheckConstraint("balance >= 0", name="check_balance_non_negative"),
    )


def downgrade() -> None:
    op.drop_table("accounts")
    op.drop_table("customers")
