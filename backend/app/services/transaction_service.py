"""Transaction service for business logic operations."""

import secrets
from datetime import datetime, timezone
from decimal import Decimal
from typing import List, Optional, Tuple

from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import (
    AuthorizationError,
    InsufficientFundsError,
    NotFoundError,
    ValidationError,
)
from app.models.account import Account, AccountStatus
from app.models.audit_log import AuditAction, AuditLog
from app.models.customer import Customer
from app.models.transaction import Transaction, TransactionType
from app.schemas.transaction import TransactionCreate


# Transaction reference prefix
TXN_PREFIX = "TXN"


def generate_transaction_reference() -> str:
    """Generate a unique transaction reference: TXN + timestamp + random."""
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")
    random_part = "".join([str(secrets.randbelow(10)) for _ in range(6)])
    return f"{TXN_PREFIX}{timestamp}{random_part}"


async def create_transaction(
    db: AsyncSession,
    account_number: str,
    customer: Customer,
    data: TransactionCreate,
    correlation_id: Optional[str] = None,
) -> Transaction:
    """Create a new transaction with atomic balance update."""
    # Get and lock the account for update
    result = await db.execute(
        select(Account)
        .where(Account.account_number == account_number)
        .with_for_update()
    )
    account = result.scalar_one_or_none()

    if account is None:
        raise NotFoundError(f"Account {account_number} not found")

    # Authorization check
    if account.customer_id != customer.id:
        raise AuthorizationError("You do not have access to this account")

    # Check account status
    if account.status != AccountStatus.ACTIVE:
        raise ValidationError(
            f"Cannot create transaction: account is {account.status.value}"
        )

    # Calculate new balance
    if data.transaction_type == TransactionType.DEPOSIT:
        new_balance = account.balance + data.amount
    elif data.transaction_type == TransactionType.WITHDRAWAL:
        if account.balance < data.amount:
            raise InsufficientFundsError(
                f"Insufficient funds. Available balance: ${account.balance}, "
                f"requested: ${data.amount}"
            )
        new_balance = account.balance - data.amount
    else:
        raise ValidationError(f"Invalid transaction type: {data.transaction_type}")

    # Generate reference
    reference = generate_transaction_reference()

    # Ensure uniqueness (very unlikely to collide)
    existing = await db.execute(
        select(Transaction).where(Transaction.reference == reference)
    )
    while existing.scalar_one_or_none() is not None:
        reference = generate_transaction_reference()
        existing = await db.execute(
            select(Transaction).where(Transaction.reference == reference)
        )

    # Create transaction record
    transaction = Transaction(
        reference=reference,
        account_id=account.id,
        transaction_type=data.transaction_type,
        amount=data.amount,
        balance_after=new_balance,
        description=data.description,
    )
    db.add(transaction)

    # Update account balance atomically
    account.balance = new_balance
    account.updated_at = datetime.now(timezone.utc)

    # Create audit log entry (no PII, no sensitive amounts in log)
    audit_log = AuditLog(
        action=AuditAction.CREATE,
        resource_type="transaction",
        resource_id=reference,
        customer_id=customer.customer_id,
        correlation_id=correlation_id,
        details={
            "transaction_type": data.transaction_type.value,
            "account_number": account_number,
        },
    )
    db.add(audit_log)

    await db.flush()
    await db.refresh(transaction)

    return transaction


async def get_transaction(
    db: AsyncSession,
    account_number: str,
    reference: str,
    customer: Customer,
) -> Transaction:
    """Get a single transaction by reference."""
    # First verify account ownership
    result = await db.execute(
        select(Account).where(Account.account_number == account_number)
    )
    account = result.scalar_one_or_none()

    if account is None:
        raise NotFoundError(f"Account {account_number} not found")

    if account.customer_id != customer.id:
        raise AuthorizationError("You do not have access to this account")

    # Get the transaction
    result = await db.execute(
        select(Transaction).where(
            Transaction.reference == reference,
            Transaction.account_id == account.id,
        )
    )
    transaction = result.scalar_one_or_none()

    if transaction is None:
        raise NotFoundError(f"Transaction {reference} not found")

    return transaction


async def get_transactions(
    db: AsyncSession,
    account_number: str,
    customer: Customer,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    transaction_type: Optional[TransactionType] = None,
    cursor: Optional[str] = None,
    limit: int = 20,
) -> Tuple[List[Transaction], int, Optional[str], bool]:
    """
    Get transactions for an account with cursor-based pagination.

    Returns: (transactions, total_count, next_cursor, has_more)
    """
    # First verify account ownership
    result = await db.execute(
        select(Account).where(Account.account_number == account_number)
    )
    account = result.scalar_one_or_none()

    if account is None:
        raise NotFoundError(f"Account {account_number} not found")

    if account.customer_id != customer.id:
        raise AuthorizationError("You do not have access to this account")

    # Build base query
    conditions = [Transaction.account_id == account.id]

    if start_date:
        conditions.append(Transaction.created_at >= start_date)
    if end_date:
        conditions.append(Transaction.created_at <= end_date)
    if transaction_type:
        conditions.append(Transaction.transaction_type == transaction_type)
    if cursor:
        # Cursor is ISO timestamp
        try:
            cursor_dt = datetime.fromisoformat(cursor)
            conditions.append(Transaction.created_at < cursor_dt)
        except ValueError:
            pass  # Invalid cursor, ignore

    # Get total count (without cursor/limit)
    count_conditions = [Transaction.account_id == account.id]
    if start_date:
        count_conditions.append(Transaction.created_at >= start_date)
    if end_date:
        count_conditions.append(Transaction.created_at <= end_date)
    if transaction_type:
        count_conditions.append(Transaction.transaction_type == transaction_type)

    count_result = await db.execute(
        select(func.count(Transaction.id)).where(and_(*count_conditions))
    )
    total = count_result.scalar() or 0

    # Get transactions with limit + 1 to check if more exist
    query = (
        select(Transaction)
        .where(and_(*conditions))
        .order_by(Transaction.created_at.desc())
        .limit(limit + 1)
    )

    result = await db.execute(query)
    transactions = list(result.scalars().all())

    # Determine if there are more
    has_more = len(transactions) > limit
    if has_more:
        transactions = transactions[:limit]

    # Generate next cursor
    next_cursor = None
    if has_more and transactions:
        last_txn = transactions[-1]
        next_cursor = last_txn.created_at.isoformat()

    return transactions, total, next_cursor, has_more


async def get_recent_transactions(
    db: AsyncSession,
    customer: Customer,
    limit: int = 5,
) -> List[Tuple[Transaction, str]]:
    """Get recent transactions across all customer accounts."""
    # Get all customer account IDs
    accounts_result = await db.execute(
        select(Account).where(Account.customer_id == customer.id)
    )
    accounts = accounts_result.scalars().all()

    if not accounts:
        return []

    account_ids = [a.id for a in accounts]
    account_map = {a.id: a.account_number for a in accounts}

    # Get recent transactions
    result = await db.execute(
        select(Transaction)
        .where(Transaction.account_id.in_(account_ids))
        .order_by(Transaction.created_at.desc())
        .limit(limit)
    )
    transactions = result.scalars().all()

    # Return with account numbers
    return [(txn, account_map[txn.account_id]) for txn in transactions]
