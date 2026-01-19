"""Pydantic schemas for Account operations."""

from datetime import datetime
from decimal import Decimal
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models.account import AccountStatus, AccountType


class AccountCreate(BaseModel):
    """Schema for creating a new account."""

    account_type: AccountType = Field(..., description="Type of account")
    initial_deposit: Decimal = Field(
        default=Decimal("0.00"),
        ge=Decimal("0.00"),
        description="Initial deposit amount (minimum $0.00)",
    )
    nickname: Optional[str] = Field(
        None, max_length=100, description="Optional account nickname"
    )

    @field_validator("initial_deposit")
    @classmethod
    def validate_decimal_places(cls, v: Decimal) -> Decimal:
        """Ensure exactly 2 decimal places."""
        return Decimal(str(v)).quantize(Decimal("0.01"))


class AccountUpdate(BaseModel):
    """Schema for updating an account."""

    nickname: Optional[str] = Field(
        None, max_length=100, description="Account nickname"
    )

    model_config = ConfigDict(extra="forbid")


class AccountResponse(BaseModel):
    """Schema for account response."""

    account_number: str = Field(..., description="16-digit account number")
    account_type: AccountType = Field(..., description="Type of account")
    status: AccountStatus = Field(..., description="Current account status")
    balance: Decimal = Field(..., description="Current balance")
    nickname: Optional[str] = Field(None, description="Account nickname")
    created_at: datetime = Field(..., description="Account creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")
    closed_at: Optional[datetime] = Field(None, description="Account closure timestamp")

    model_config = ConfigDict(from_attributes=True)


class AccountSummary(BaseModel):
    """Brief account summary for listings."""

    account_number: str
    account_type: AccountType
    status: AccountStatus
    balance: Decimal
    nickname: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class AccountListResponse(BaseModel):
    """Response for account list endpoint."""

    accounts: List[AccountSummary]
    total: int = Field(..., description="Total number of accounts")


class AccountBalanceResponse(BaseModel):
    """Response for account balance check."""

    account_number: str
    balance: Decimal
    available_balance: Decimal = Field(
        ..., description="Balance available for withdrawal"
    )
    as_of: datetime = Field(..., description="Timestamp of balance check")


class AccountCloseRequest(BaseModel):
    """Request to close an account."""

    confirm: bool = Field(
        ..., description="Must be true to confirm account closure"
    )


class AccountsAggregateResponse(BaseModel):
    """Aggregate summary of all customer accounts."""

    total_accounts: int = Field(..., description="Number of accounts")
    active_accounts: int = Field(..., description="Number of active accounts")
    total_balance: Decimal = Field(..., description="Sum of all account balances")
    accounts_by_type: dict[str, int] = Field(
        ..., description="Count of accounts by type"
    )
