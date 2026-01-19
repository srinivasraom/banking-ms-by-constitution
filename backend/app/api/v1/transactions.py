"""Transaction API endpoints."""

from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_customer, get_db
from app.core.exceptions import (
    AuthorizationError,
    InsufficientFundsError,
    NotFoundError,
    ValidationError,
)
from app.models.customer import Customer
from app.models.transaction import TransactionType
from app.schemas.transaction import (
    TransactionCreate,
    TransactionListResponse,
    TransactionResponse,
)
from app.services import transaction_service

router = APIRouter(tags=["transactions"])


def get_correlation_id(request: Request) -> Optional[str]:
    """Extract correlation ID from request state."""
    return getattr(request.state, "correlation_id", None)


@router.post(
    "/accounts/{account_number}/transactions",
    response_model=TransactionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a transaction",
    description="Create a deposit or withdrawal transaction for the specified account.",
)
async def create_transaction(
    request: Request,
    account_number: str,
    data: TransactionCreate,
    db: AsyncSession = Depends(get_db),
    customer: Customer = Depends(get_current_customer),
) -> TransactionResponse:
    """Create a new transaction (deposit or withdrawal)."""
    correlation_id = get_correlation_id(request)

    try:
        transaction = await transaction_service.create_transaction(
            db, account_number, customer, data, correlation_id
        )
        return TransactionResponse.model_validate(transaction)
    except NotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except AuthorizationError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
    except InsufficientFundsError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except ValidationError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get(
    "/accounts/{account_number}/transactions",
    response_model=TransactionListResponse,
    summary="List transactions",
    description="Get transaction history for the specified account with optional filters and pagination.",
)
async def list_transactions(
    request: Request,
    account_number: str,
    start_date: Optional[datetime] = Query(
        None, description="Filter transactions from this date (ISO format)"
    ),
    end_date: Optional[datetime] = Query(
        None, description="Filter transactions until this date (ISO format)"
    ),
    transaction_type: Optional[TransactionType] = Query(
        None, alias="type", description="Filter by transaction type"
    ),
    cursor: Optional[str] = Query(
        None, description="Pagination cursor (ISO timestamp)"
    ),
    limit: int = Query(
        20, ge=1, le=100, description="Number of transactions to return"
    ),
    db: AsyncSession = Depends(get_db),
    customer: Customer = Depends(get_current_customer),
) -> TransactionListResponse:
    """List transactions with filters and pagination."""
    try:
        transactions, total, next_cursor, has_more = (
            await transaction_service.get_transactions(
                db,
                account_number,
                customer,
                start_date=start_date,
                end_date=end_date,
                transaction_type=transaction_type,
                cursor=cursor,
                limit=limit,
            )
        )
        return TransactionListResponse(
            transactions=[TransactionResponse.model_validate(t) for t in transactions],
            total=total,
            next_cursor=next_cursor,
            has_more=has_more,
        )
    except NotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except AuthorizationError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))


@router.get(
    "/accounts/{account_number}/transactions/{reference}",
    response_model=TransactionResponse,
    summary="Get transaction details",
    description="Get details of a specific transaction by reference.",
)
async def get_transaction(
    request: Request,
    account_number: str,
    reference: str,
    db: AsyncSession = Depends(get_db),
    customer: Customer = Depends(get_current_customer),
) -> TransactionResponse:
    """Get a single transaction by reference."""
    try:
        transaction = await transaction_service.get_transaction(
            db, account_number, reference, customer
        )
        return TransactionResponse.model_validate(transaction)
    except NotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except AuthorizationError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
