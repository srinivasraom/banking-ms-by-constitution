"""Account API endpoints."""

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_customer, get_db
from app.core.exceptions import (
    AccountClosureError,
    AuthorizationError,
    NotFoundError,
    ValidationError,
)
from app.models.account import AccountStatus
from app.models.customer import Customer
from app.schemas.account import (
    AccountCloseRequest,
    AccountCreate,
    AccountListResponse,
    AccountResponse,
    AccountsAggregateResponse,
    AccountSummary,
    AccountUpdate,
)
from app.services import account_service

router = APIRouter(prefix="/accounts", tags=["accounts"])


def get_correlation_id(request: Request) -> Optional[str]:
    """Extract correlation ID from request state."""
    return getattr(request.state, "correlation_id", None)


@router.post(
    "",
    response_model=AccountResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new account",
    description="Create a new checking or savings account for the authenticated customer.",
)
async def create_account(
    request: Request,
    data: AccountCreate,
    db: AsyncSession = Depends(get_db),
    customer: Customer = Depends(get_current_customer),
) -> AccountResponse:
    """Create a new bank account."""
    correlation_id = get_correlation_id(request)
    account = await account_service.create_account(db, customer, data, correlation_id)
    return AccountResponse.model_validate(account)


@router.get(
    "",
    response_model=AccountListResponse,
    summary="List customer accounts",
    description="Get all accounts for the authenticated customer, optionally filtered by status.",
)
async def list_accounts(
    request: Request,
    status_filter: Optional[AccountStatus] = Query(
        None, alias="status", description="Filter by account status"
    ),
    db: AsyncSession = Depends(get_db),
    customer: Customer = Depends(get_current_customer),
) -> AccountListResponse:
    """List all accounts for the current customer."""
    accounts = await account_service.get_accounts(db, customer, status_filter)
    return AccountListResponse(
        accounts=[AccountSummary.model_validate(a) for a in accounts],
        total=len(accounts),
    )


@router.get(
    "/summary",
    response_model=AccountsAggregateResponse,
    summary="Get accounts summary",
    description="Get aggregate summary of all accounts including total balance.",
)
async def get_accounts_summary(
    db: AsyncSession = Depends(get_db),
    customer: Customer = Depends(get_current_customer),
) -> AccountsAggregateResponse:
    """Get aggregate summary of customer accounts."""
    return await account_service.get_accounts_aggregate(db, customer)


@router.get(
    "/{account_number}",
    response_model=AccountResponse,
    summary="Get account details",
    description="Get detailed information about a specific account.",
)
async def get_account(
    request: Request,
    account_number: str,
    db: AsyncSession = Depends(get_db),
    customer: Customer = Depends(get_current_customer),
) -> AccountResponse:
    """Get account details by account number."""
    try:
        account = await account_service.get_account(db, account_number, customer)
        return AccountResponse.model_validate(account)
    except NotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except AuthorizationError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))


@router.patch(
    "/{account_number}",
    response_model=AccountResponse,
    summary="Update account settings",
    description="Update account settings such as nickname.",
)
async def update_account(
    request: Request,
    account_number: str,
    data: AccountUpdate,
    db: AsyncSession = Depends(get_db),
    customer: Customer = Depends(get_current_customer),
) -> AccountResponse:
    """Update account settings."""
    correlation_id = get_correlation_id(request)
    try:
        account = await account_service.update_account(
            db, account_number, customer, data, correlation_id
        )
        return AccountResponse.model_validate(account)
    except NotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except AuthorizationError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
    except ValidationError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.delete(
    "/{account_number}",
    response_model=AccountResponse,
    summary="Close account",
    description="Close an account. Account must have zero balance.",
)
async def close_account(
    request: Request,
    account_number: str,
    close_request: AccountCloseRequest,
    db: AsyncSession = Depends(get_db),
    customer: Customer = Depends(get_current_customer),
) -> AccountResponse:
    """Close a bank account."""
    if not close_request.confirm:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Must confirm account closure by setting confirm=true",
        )

    correlation_id = get_correlation_id(request)
    try:
        account = await account_service.close_account(
            db, account_number, customer, correlation_id
        )
        return AccountResponse.model_validate(account)
    except NotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except AuthorizationError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
    except (ValidationError, AccountClosureError) as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
