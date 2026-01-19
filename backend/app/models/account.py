"""Account SQLAlchemy model."""

import enum
from datetime import datetime, timezone
from decimal import Decimal
from typing import TYPE_CHECKING, List

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    Enum,
    ForeignKey,
    Numeric,
    String,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.customer import Customer
    from app.models.transaction import Transaction


class AccountType(str, enum.Enum):
    """Types of bank accounts."""

    CHECKING = "checking"
    SAVINGS = "savings"


class AccountStatus(str, enum.Enum):
    """Account status states."""

    ACTIVE = "active"
    INACTIVE = "inactive"
    CLOSED = "closed"
    FROZEN = "frozen"


class Account(Base):
    """Account model representing a bank account."""

    __tablename__ = "accounts"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    account_number: Mapped[str] = mapped_column(
        String(16), unique=True, index=True, nullable=False
    )
    customer_id: Mapped[int] = mapped_column(
        ForeignKey("customers.id", ondelete="RESTRICT"), nullable=False, index=True
    )

    account_type: Mapped[AccountType] = mapped_column(
        Enum(AccountType), nullable=False
    )
    status: Mapped[AccountStatus] = mapped_column(
        Enum(AccountStatus), default=AccountStatus.ACTIVE, nullable=False
    )

    # Balance with 2 decimal precision, non-negative constraint
    balance: Mapped[Decimal] = mapped_column(
        Numeric(precision=15, scale=2), default=Decimal("0.00"), nullable=False
    )

    # Optional nickname for the account
    nickname: Mapped[str | None] = mapped_column(String(100), nullable=True)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        server_default=func.now(),
        nullable=False,
    )
    closed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Relationships
    customer: Mapped["Customer"] = relationship("Customer", back_populates="accounts")
    transactions: Mapped[List["Transaction"]] = relationship(
        "Transaction", back_populates="account", lazy="selectin"
    )

    __table_args__ = (
        CheckConstraint("balance >= 0", name="check_balance_non_negative"),
    )

    def __repr__(self) -> str:
        return f"<Account {self.account_number}: {self.account_type.value} - {self.status.value}>"
