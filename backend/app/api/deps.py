"""API dependencies for dependency injection."""

from typing import Annotated, Optional

from fastapi import Depends, Header, HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import AuthenticationError
from app.core.logging import get_correlation_id, set_correlation_id
from app.core.security import verify_access_token
from app.database import get_async_session
from app.models.customer import Customer, CustomerStatus

# OAuth2 scheme for token authentication
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


async def get_db() -> AsyncSession:
    """Dependency to get database session."""
    async for session in get_async_session():
        yield session


async def get_correlation_id_header(
    x_correlation_id: Annotated[Optional[str], Header()] = None,
) -> str:
    """Get or create correlation ID from header."""
    if x_correlation_id:
        set_correlation_id(x_correlation_id)
    return get_correlation_id()


async def get_current_customer_id(
    token: Annotated[str, Depends(oauth2_scheme)],
) -> str:
    """Get current customer ID from JWT token."""
    try:
        payload = verify_access_token(token)
        customer_id = payload.get("sub")
        if not customer_id:
            raise AuthenticationError("Token missing subject claim")
        return customer_id
    except AuthenticationError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_current_customer(
    customer_id: Annotated[str, Depends(get_current_customer_id)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> Customer:
    """Get the current authenticated customer."""
    result = await db.execute(
        select(Customer).where(Customer.customer_id == customer_id)
    )
    customer = result.scalar_one_or_none()

    if customer is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Customer not found",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if customer.status != CustomerStatus.ACTIVE:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Customer account is not active",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return customer


async def get_client_info(request: Request) -> dict:
    """Get client information from request."""
    return {
        "ip_address": request.client.host if request.client else None,
        "user_agent": request.headers.get("user-agent"),
    }


# Type aliases for cleaner dependency injection
DBSession = Annotated[AsyncSession, Depends(get_db)]
CurrentCustomerId = Annotated[str, Depends(get_current_customer_id)]
CurrentCustomer = Annotated[Customer, Depends(get_current_customer)]
CorrelationId = Annotated[str, Depends(get_correlation_id_header)]
ClientInfo = Annotated[dict, Depends(get_client_info)]
