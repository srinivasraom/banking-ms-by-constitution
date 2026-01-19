"""Pydantic schemas for Customer operations."""

import re
from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from app.models.customer import CustomerStatus


class CustomerCreate(BaseModel):
    """Schema for customer registration."""

    email: EmailStr = Field(..., description="Customer email address")
    password: str = Field(..., min_length=8, description="Password (min 8 characters)")
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    phone: str = Field(..., description="Phone in E.164 format")
    date_of_birth: date = Field(..., description="Date of birth (must be 18+)")
    address_line1: str = Field(..., min_length=1, max_length=255)
    address_line2: Optional[str] = Field(None, max_length=255)
    city: str = Field(..., min_length=1, max_length=100)
    state: str = Field(..., min_length=1, max_length=100)
    postal_code: str = Field(..., min_length=1, max_length=20)
    country: str = Field(default="US", min_length=2, max_length=2)

    @field_validator("phone")
    @classmethod
    def validate_phone_e164(cls, v: str) -> str:
        """Validate phone number is in E.164 format."""
        pattern = r"^\+[1-9]\d{1,14}$"
        if not re.match(pattern, v):
            raise ValueError("Phone must be in E.164 format (e.g., +14155551234)")
        return v

    @field_validator("date_of_birth")
    @classmethod
    def validate_age(cls, v: date) -> date:
        """Validate customer is at least 18 years old."""
        today = date.today()
        age = (
            today.year
            - v.year
            - ((today.month, today.day) < (v.month, v.day))
        )
        if age < 18:
            raise ValueError("Customer must be at least 18 years old")
        return v


class CustomerUpdate(BaseModel):
    """Schema for updating customer profile."""

    first_name: Optional[str] = Field(None, min_length=1, max_length=100)
    last_name: Optional[str] = Field(None, min_length=1, max_length=100)
    phone: Optional[str] = Field(None, description="Phone in E.164 format")
    address_line1: Optional[str] = Field(None, min_length=1, max_length=255)
    address_line2: Optional[str] = Field(None, max_length=255)
    city: Optional[str] = Field(None, min_length=1, max_length=100)
    state: Optional[str] = Field(None, min_length=1, max_length=100)
    postal_code: Optional[str] = Field(None, min_length=1, max_length=20)
    country: Optional[str] = Field(None, min_length=2, max_length=2)

    @field_validator("phone")
    @classmethod
    def validate_phone_e164(cls, v: Optional[str]) -> Optional[str]:
        """Validate phone number is in E.164 format if provided."""
        if v is None:
            return v
        pattern = r"^\+[1-9]\d{1,14}$"
        if not re.match(pattern, v):
            raise ValueError("Phone must be in E.164 format (e.g., +14155551234)")
        return v

    model_config = ConfigDict(extra="forbid")


class CustomerResponse(BaseModel):
    """Schema for customer profile response."""

    customer_id: str = Field(..., description="Unique customer identifier")
    email: str = Field(..., description="Customer email")
    first_name: str
    last_name: str
    phone: str
    date_of_birth: date
    address_line1: str
    address_line2: Optional[str] = None
    city: str
    state: str
    postal_code: str
    country: str
    status: CustomerStatus
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CustomerSummary(BaseModel):
    """Brief customer summary."""

    customer_id: str
    email: str
    first_name: str
    last_name: str
    status: CustomerStatus

    model_config = ConfigDict(from_attributes=True)
