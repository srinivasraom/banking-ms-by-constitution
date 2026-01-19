"""API v1 router configuration."""

from fastapi import APIRouter

from app.api.v1 import accounts, auth, customers, health, transactions

# Create main API router
api_router = APIRouter()

# Include route modules
api_router.include_router(health.router, tags=["Health"])
api_router.include_router(auth.router)
api_router.include_router(customers.router)
api_router.include_router(accounts.router)
api_router.include_router(transactions.router)
