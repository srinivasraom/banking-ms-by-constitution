"""Customer API endpoints."""

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_customer, get_db
from app.core.exceptions import ValidationError
from app.models.customer import Customer
from app.schemas.customer import CustomerResponse, CustomerUpdate
from app.services import customer_service

router = APIRouter(prefix="/customers", tags=["customers"])


def get_correlation_id(request: Request) -> Optional[str]:
    """Extract correlation ID from request state."""
    return getattr(request.state, "correlation_id", None)


@router.get(
    "/me",
    response_model=CustomerResponse,
    summary="Get current customer profile",
    description="Get the profile of the currently authenticated customer.",
)
async def get_current_profile(
    customer: Customer = Depends(get_current_customer),
) -> CustomerResponse:
    """Get the current customer's profile."""
    return CustomerResponse.model_validate(customer)


@router.put(
    "/me",
    response_model=CustomerResponse,
    summary="Update current customer profile",
    description="Update the profile of the currently authenticated customer.",
)
async def update_current_profile(
    request: Request,
    data: CustomerUpdate,
    db: AsyncSession = Depends(get_db),
    customer: Customer = Depends(get_current_customer),
) -> CustomerResponse:
    """Update the current customer's profile."""
    correlation_id = get_correlation_id(request)
    updated_customer = await customer_service.update_customer(
        db, customer, data, correlation_id
    )
    return CustomerResponse.model_validate(updated_customer)


@router.delete(
    "/me",
    response_model=CustomerResponse,
    summary="Deactivate current customer profile",
    description="Deactivate the current customer's account. Requires no active accounts.",
)
async def deactivate_current_profile(
    request: Request,
    db: AsyncSession = Depends(get_db),
    customer: Customer = Depends(get_current_customer),
) -> CustomerResponse:
    """Deactivate the current customer's account."""
    correlation_id = get_correlation_id(request)

    try:
        deactivated_customer = await customer_service.deactivate_customer(
            db, customer, correlation_id
        )
        return CustomerResponse.model_validate(deactivated_customer)
    except ValidationError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
