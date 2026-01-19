"""Create enum types for banking entities.

Revision ID: 001_enums
Revises:
Create Date: 2026-01-16

"""
from typing import Sequence, Union

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "001_enums"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create enum types
    op.execute("CREATE TYPE customer_status AS ENUM ('active', 'inactive', 'suspended')")
    op.execute("CREATE TYPE account_type AS ENUM ('checking', 'savings')")
    op.execute("CREATE TYPE account_status AS ENUM ('active', 'inactive', 'closed', 'frozen')")
    op.execute("CREATE TYPE transaction_type AS ENUM ('deposit', 'withdrawal', 'transfer_in', 'transfer_out')")
    op.execute("CREATE TYPE audit_action AS ENUM ('create', 'read', 'update', 'delete')")


def downgrade() -> None:
    # Drop enum types in reverse order
    op.execute("DROP TYPE IF EXISTS audit_action")
    op.execute("DROP TYPE IF EXISTS transaction_type")
    op.execute("DROP TYPE IF EXISTS account_status")
    op.execute("DROP TYPE IF EXISTS account_type")
    op.execute("DROP TYPE IF EXISTS customer_status")
