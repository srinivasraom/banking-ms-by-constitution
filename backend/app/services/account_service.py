"""Account service for business logic operations."""

import secrets
from datetime import datetime, timezone
from decimal import Decimal
from typing import List, Optional

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import (
    AccountClosureError,
    AuthorizationError,
    NotFoundError,
    ValidationError,
)
from app.models.account import Account, AccountStatus, AccountType
from app.models.audit_log import AuditAction, AuditLog
from app.models.customer import Customer
from app.schemas.account import (
    AccountCreate,
    AccountsAggregateResponse,
    AccountUpdate,
)


# Bank prefix for account numbers
BANK_PREFIX = "1234"


def generate_account_number() -> str:
    """Generate a unique 16-digit account number with bank prefix."""
    # 4-digit bank prefix + 12 random digits
    random_part = "".join([str(secrets.randbelow(10)) for _ in range(12)])
    return f"{BANK_PREFIX}{random_part}"


async def create_account(
    db: AsyncSession,
    customer: Customer,
    data: AccountCreate,
    correlation_id: Optional[str] = None,
) -> Account:
    """Create a new bank account for a customer."""
    # Generate unique account number
    account_number = generate_account_number()

    # Ensure uniqueness (very unlikely to collide, but safety first)
    existing = await db.execute(
        select(Account).where(Account.account_number == account_number)
    )
    while existing.scalar_one_or_none() is not None:
        account_number = generate_account_number()
        existing = await db.execute(
            select(Account).where(Account.account_number == account_number)
        )

    account = Account(
        account_number=account_number,
        customer_id=customer.id,
        account_type=data.account_type,
        balance=data.initial_deposit,
        nickname=data.nickname,
        status=AccountStatus.ACTIVE,
    )

    db.add(account)

    # Create audit log entry
    audit_log = AuditLog(
        action=AuditAction.CREATE,
        resource_type="account",
        resource_id=account_number,
        customer_id=customer.customer_id,
        correlation_id=correlation_id,
        details={
            "account_type": data.account_type.value,
            "initial_deposit": str(data.initial_deposit),
        },
    )
    db.add(audit_log)

    await db.flush()
    await db.refresh(account)

    return account


async def get_account(
    db: AsyncSession,
    account_number: str,
    customer: Customer,
) -> Account:
    """Get account by account number, verifying ownership."""
    result = await db.execute(
        select(Account).where(Account.account_number == account_number)
    )
    account = result.scalar_one_or_none()

    if account is None:
        raise NotFoundError(f"Account {account_number} not found")

    # Authorization check - customer can only access their own accounts
    if account.customer_id != customer.id:
        raise AuthorizationError("You do not have access to this account")

    return account


async def get_accounts(
    db: AsyncSession,
    customer: Customer,
    status: Optional[AccountStatus] = None,
) -> List[Account]:
    """Get all accounts for a customer, optionally filtered by status."""
    query = select(Account).where(Account.customer_id == customer.id)

    if status is not None:
        query = query.where(Account.status == status)

    query = query.order_by(Account.created_at.desc())

    result = await db.execute(query)
    return list(result.scalars().all())


async def update_account(
    db: AsyncSession,
    account_number: str,
    customer: Customer,
    data: AccountUpdate,
    correlation_id: Optional[str] = None,
) -> Account:
    """Update account settings (currently only nickname)."""
    account = await get_account(db, account_number, customer)

    if account.status == AccountStatus.CLOSED:
        raise ValidationError("Cannot update a closed account")

    # Track changes for audit log
    changes = {}
    if data.nickname is not None:
        changes["nickname"] = {"old": account.nickname, "new": data.nickname}
        account.nickname = data.nickname

    if changes:
        account.updated_at = datetime.now(timezone.utc)

        # Create audit log entry
        audit_log = AuditLog(
            action=AuditAction.UPDATE,
            resource_type="account",
            resource_id=account_number,
            customer_id=customer.customer_id,
            correlation_id=correlation_id,
            details={"changes": changes},
        )
        db.add(audit_log)

    await db.flush()
    await db.refresh(account)

    return account


async def close_account(
    db: AsyncSession,
    account_number: str,
    customer: Customer,
    correlation_id: Optional[str] = None,
) -> Account:
    """Close an account (requires zero balance)."""
    account = await get_account(db, account_number, customer)

    if account.status == AccountStatus.CLOSED:
        raise ValidationError("Account is already closed")

    if account.balance != Decimal("0.00"):
        raise AccountClosureError(
            f"Account must have zero balance to close. Current balance: ${account.balance}"
        )

    account.status = AccountStatus.CLOSED
    account.closed_at = datetime.now(timezone.utc)
    account.updated_at = datetime.now(timezone.utc)

    # Create audit log entry
    audit_log = AuditLog(
        action=AuditAction.UPDATE,
        resource_type="account",
        resource_id=account_number,
        customer_id=customer.customer_id,
        correlation_id=correlation_id,
        details={"action": "close_account"},
    )
    db.add(audit_log)

    await db.flush()
    await db.refresh(account)

    return account


async def get_accounts_aggregate(
    db: AsyncSession,
    customer: Customer,
) -> AccountsAggregateResponse:
    """Get aggregate summary of all customer accounts."""
    accounts = await get_accounts(db, customer)

    total_balance = sum(a.balance for a in accounts)
    active_count = sum(1 for a in accounts if a.status == AccountStatus.ACTIVE)

    accounts_by_type = {}
    for a in accounts:
        type_name = a.account_type.value
        accounts_by_type[type_name] = accounts_by_type.get(type_name, 0) + 1

    return AccountsAggregateResponse(
        total_accounts=len(accounts),
        active_accounts=active_count,
        total_balance=total_balance,
        accounts_by_type=accounts_by_type,
    )


async def verify_account_ownership(
    db: AsyncSession,
    account_number: str,
    customer: Customer,
) -> bool:
    """Verify that a customer owns an account (used by transaction service)."""
    result = await db.execute(
        select(Account).where(
            Account.account_number == account_number,
            Account.customer_id == customer.id,
        )
    )
    return result.scalar_one_or_none() is not None
