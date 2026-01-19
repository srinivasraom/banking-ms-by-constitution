"""Customer service for business logic operations."""

import secrets
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import (
    AuthorizationError,
    DuplicateResourceError,
    NotFoundError,
    ValidationError,
)
from app.core.security import get_password_hash, verify_password
from app.models.account import Account, AccountStatus
from app.models.audit_log import AuditAction, AuditLog
from app.models.customer import Customer, CustomerStatus
from app.schemas.customer import CustomerCreate, CustomerUpdate


# Customer ID prefix
CUSTOMER_PREFIX = "CUST"


async def generate_customer_id(db: AsyncSession) -> str:
    """Generate a unique customer ID with CUST prefix + sequential number."""
    # Get the count of existing customers for sequential numbering
    result = await db.execute(select(func.count(Customer.id)))
    count = result.scalar() or 0

    # Generate a customer ID: CUST + 8 digits (zero-padded sequence + random)
    sequence = str(count + 1).zfill(4)
    random_part = "".join([str(secrets.randbelow(10)) for _ in range(4)])
    customer_id = f"{CUSTOMER_PREFIX}{sequence}{random_part}"

    # Ensure uniqueness
    existing = await db.execute(
        select(Customer).where(Customer.customer_id == customer_id)
    )
    while existing.scalar_one_or_none() is not None:
        random_part = "".join([str(secrets.randbelow(10)) for _ in range(4)])
        customer_id = f"{CUSTOMER_PREFIX}{sequence}{random_part}"
        existing = await db.execute(
            select(Customer).where(Customer.customer_id == customer_id)
        )

    return customer_id


async def register_customer(
    db: AsyncSession,
    data: CustomerCreate,
    correlation_id: Optional[str] = None,
) -> Customer:
    """Register a new customer."""
    # Check if email already exists
    existing = await db.execute(
        select(Customer).where(Customer.email == data.email.lower())
    )
    if existing.scalar_one_or_none() is not None:
        raise DuplicateResourceError("A customer with this email already exists")

    # Generate customer ID
    customer_id = await generate_customer_id(db)

    # Hash password
    password_hash = get_password_hash(data.password)

    customer = Customer(
        customer_id=customer_id,
        email=data.email.lower(),
        password_hash=password_hash,
        first_name=data.first_name,
        last_name=data.last_name,
        phone=data.phone,
        date_of_birth=data.date_of_birth,
        address_line1=data.address_line1,
        address_line2=data.address_line2,
        city=data.city,
        state=data.state,
        postal_code=data.postal_code,
        country=data.country,
        status=CustomerStatus.ACTIVE,
    )

    db.add(customer)

    # Create audit log entry
    audit_log = AuditLog(
        action=AuditAction.CREATE,
        resource_type="customer",
        resource_id=customer_id,
        customer_id=customer_id,
        correlation_id=correlation_id,
        details={"action": "register"},
    )
    db.add(audit_log)

    await db.flush()
    await db.refresh(customer)

    return customer


async def get_customer_by_email(db: AsyncSession, email: str) -> Optional[Customer]:
    """Get customer by email address."""
    result = await db.execute(
        select(Customer).where(Customer.email == email.lower())
    )
    return result.scalar_one_or_none()


async def get_customer_by_id(db: AsyncSession, customer_id: str) -> Optional[Customer]:
    """Get customer by customer ID."""
    result = await db.execute(
        select(Customer).where(Customer.customer_id == customer_id)
    )
    return result.scalar_one_or_none()


async def authenticate_customer(
    db: AsyncSession, email: str, password: str
) -> Optional[Customer]:
    """Authenticate a customer with email and password."""
    customer = await get_customer_by_email(db, email)

    if customer is None:
        return None

    if not verify_password(password, customer.password_hash):
        return None

    if customer.status != CustomerStatus.ACTIVE:
        return None

    return customer


async def update_customer(
    db: AsyncSession,
    customer: Customer,
    data: CustomerUpdate,
    correlation_id: Optional[str] = None,
) -> Customer:
    """Update customer profile."""
    # Track changes for audit log
    changes = {}
    update_data = data.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        if value is not None:
            old_value = getattr(customer, field)
            if old_value != value:
                changes[field] = {"old": old_value, "new": value}
                setattr(customer, field, value)

    if changes:
        customer.updated_at = datetime.now(timezone.utc)

        # Create audit log entry (without PII in details)
        audit_log = AuditLog(
            action=AuditAction.UPDATE,
            resource_type="customer",
            resource_id=customer.customer_id,
            customer_id=customer.customer_id,
            correlation_id=correlation_id,
            details={"fields_updated": list(changes.keys())},
        )
        db.add(audit_log)

    await db.flush()
    await db.refresh(customer)

    return customer


async def deactivate_customer(
    db: AsyncSession,
    customer: Customer,
    correlation_id: Optional[str] = None,
) -> Customer:
    """Deactivate a customer account (requires no active accounts)."""
    # Check for active accounts
    result = await db.execute(
        select(Account).where(
            Account.customer_id == customer.id,
            Account.status == AccountStatus.ACTIVE,
        )
    )
    active_accounts = result.scalars().all()

    if active_accounts:
        raise ValidationError(
            f"Cannot deactivate account: {len(active_accounts)} active account(s) remain. "
            "Please close all accounts before deactivating your profile."
        )

    customer.status = CustomerStatus.INACTIVE
    customer.updated_at = datetime.now(timezone.utc)

    # Create audit log entry
    audit_log = AuditLog(
        action=AuditAction.UPDATE,
        resource_type="customer",
        resource_id=customer.customer_id,
        customer_id=customer.customer_id,
        correlation_id=correlation_id,
        details={"action": "deactivate"},
    )
    db.add(audit_log)

    await db.flush()
    await db.refresh(customer)

    return customer
