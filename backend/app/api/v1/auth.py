"""Authentication API endpoints."""

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.core.exceptions import AuthenticationError, DuplicateResourceError
from app.core.security import (
    create_access_token,
    create_refresh_token,
    verify_refresh_token,
)
from app.models.audit_log import AuditAction, AuditLog
from app.schemas.auth import LoginRequest, RefreshTokenRequest, TokenResponse
from app.schemas.customer import CustomerCreate
from app.services import customer_service

router = APIRouter(prefix="/auth", tags=["authentication"])


def get_correlation_id(request: Request) -> Optional[str]:
    """Extract correlation ID from request state."""
    return getattr(request.state, "correlation_id", None)


@router.post(
    "/register",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register new customer",
    description="Create a new customer account and return authentication tokens.",
)
async def register(
    request: Request,
    data: CustomerCreate,
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    """Register a new customer and return tokens."""
    correlation_id = get_correlation_id(request)

    try:
        customer = await customer_service.register_customer(db, data, correlation_id)
    except DuplicateResourceError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))

    # Generate tokens
    token_data = {"sub": customer.customer_id}
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        expires_in=900,  # 15 minutes
    )


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Login customer",
    description="Authenticate customer and return access and refresh tokens.",
)
async def login(
    request: Request,
    data: LoginRequest,
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    """Authenticate customer and return tokens."""
    correlation_id = get_correlation_id(request)

    customer = await customer_service.authenticate_customer(
        db, data.email, data.password
    )

    if customer is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Log successful login
    audit_log = AuditLog(
        action=AuditAction.READ,
        resource_type="auth",
        resource_id=customer.customer_id,
        customer_id=customer.customer_id,
        correlation_id=correlation_id,
        details={"action": "login"},
    )
    db.add(audit_log)
    await db.flush()

    # Generate tokens
    token_data = {"sub": customer.customer_id}
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        expires_in=900,  # 15 minutes
    )


@router.post(
    "/refresh",
    response_model=TokenResponse,
    summary="Refresh access token",
    description="Exchange a valid refresh token for new access and refresh tokens.",
)
async def refresh(
    request: Request,
    data: RefreshTokenRequest,
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    """Refresh access token using refresh token."""
    correlation_id = get_correlation_id(request)

    try:
        payload = verify_refresh_token(data.refresh_token)
        customer_id = payload.get("sub")
        if not customer_id:
            raise AuthenticationError("Invalid token: missing subject claim")
    except AuthenticationError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Verify customer still exists and is active
    customer = await customer_service.get_customer_by_id(db, customer_id)
    if customer is None or customer.status.value != "active":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Customer not found or inactive",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Log token refresh
    audit_log = AuditLog(
        action=AuditAction.READ,
        resource_type="auth",
        resource_id=customer.customer_id,
        customer_id=customer.customer_id,
        correlation_id=correlation_id,
        details={"action": "token_refresh"},
    )
    db.add(audit_log)
    await db.flush()

    # Generate new tokens
    token_data = {"sub": customer.customer_id}
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        expires_in=900,  # 15 minutes
    )
