"""Pydantic schemas for Transaction operations."""

from datetime import datetime
from decimal import Decimal
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models.transaction import TransactionType


class TransactionCreate(BaseModel):
    """Schema for creating a new transaction (deposit/withdrawal)."""

    transaction_type: TransactionType = Field(
        ..., description="Type of transaction"
    )
    amount: Decimal = Field(
        ...,
        gt=Decimal("0.00"),
        description="Transaction amount (must be positive)",
    )
    description: Optional[str] = Field(
        None, max_length=500, description="Optional transaction description"
    )

    @field_validator("amount")
    @classmethod
    def validate_decimal_places(cls, v: Decimal) -> Decimal:
        """Ensure exactly 2 decimal places."""
        return Decimal(str(v)).quantize(Decimal("0.01"))

    @field_validator("transaction_type")
    @classmethod
    def validate_transaction_type(cls, v: TransactionType) -> TransactionType:
        """Only allow deposit and withdrawal for direct creation."""
        if v not in (TransactionType.DEPOSIT, TransactionType.WITHDRAWAL):
            raise ValueError("Only deposit and withdrawal transactions are allowed")
        return v


class TransactionResponse(BaseModel):
    """Schema for transaction response."""

    reference: str = Field(..., description="Unique transaction reference")
    transaction_type: TransactionType = Field(..., description="Type of transaction")
    amount: Decimal = Field(..., description="Transaction amount")
    balance_after: Decimal = Field(..., description="Account balance after transaction")
    description: Optional[str] = Field(None, description="Transaction description")
    created_at: datetime = Field(..., description="Transaction timestamp")

    model_config = ConfigDict(from_attributes=True)


class TransactionListResponse(BaseModel):
    """Response for transaction list endpoint with pagination."""

    transactions: List[TransactionResponse]
    total: int = Field(..., description="Total number of transactions matching filters")
    next_cursor: Optional[str] = Field(
        None, description="Cursor for next page (ISO timestamp)"
    )
    has_more: bool = Field(..., description="Whether more transactions exist")


class TransactionFilters(BaseModel):
    """Filters for transaction queries."""

    start_date: Optional[datetime] = Field(
        None, description="Filter transactions from this date"
    )
    end_date: Optional[datetime] = Field(
        None, description="Filter transactions until this date"
    )
    transaction_type: Optional[TransactionType] = Field(
        None, description="Filter by transaction type"
    )
    min_amount: Optional[Decimal] = Field(
        None, ge=Decimal("0.00"), description="Minimum transaction amount"
    )
    max_amount: Optional[Decimal] = Field(
        None, ge=Decimal("0.00"), description="Maximum transaction amount"
    )
