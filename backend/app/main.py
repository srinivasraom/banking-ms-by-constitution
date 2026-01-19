"""FastAPI application entry point."""

from contextlib import asynccontextmanager
from typing import Any, AsyncIterator, Dict

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.v1.router import api_router
from app.config import settings
from app.core.exceptions import (
    AuthenticationError,
    AuthorizationError,
    BankingException,
    NotFoundError,
    ValidationError,
)
from app.core.logging import get_correlation_id, logger, set_correlation_id
from app.database import close_db, init_db


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """Application lifespan handler."""
    # Startup
    logger.info("Starting Banking Microservices API")
    await init_db()
    yield
    # Shutdown
    logger.info("Shutting down Banking Microservices API")
    await close_db()


# Create FastAPI application
app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="Banking Microservices API for managing customers, accounts, and transactions",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Correlation-ID"],
)


# Middleware to add correlation ID
@app.middleware("http")
async def correlation_id_middleware(request: Request, call_next: Any) -> Any:
    """Add correlation ID to request and response."""
    # Get or create correlation ID
    correlation_id = request.headers.get("X-Correlation-ID")
    if correlation_id:
        set_correlation_id(correlation_id)
    else:
        correlation_id = get_correlation_id()

    # Process request
    response = await call_next(request)

    # Add correlation ID to response
    response.headers["X-Correlation-ID"] = correlation_id
    return response


# Exception handlers
def create_error_response(
    code: str,
    message: str,
    details: Dict[str, Any],
    status_code: int,
) -> JSONResponse:
    """Create standardized error response."""
    return JSONResponse(
        status_code=status_code,
        content={
            "error": {
                "code": code,
                "message": message,
                "details": details,
            }
        },
    )


@app.exception_handler(NotFoundError)
async def not_found_exception_handler(
    request: Request,
    exc: NotFoundError,
) -> JSONResponse:
    """Handle not found errors."""
    logger.warning(f"Not found: {exc.message}", extra={"details": exc.details})
    return create_error_response(
        code=exc.code,
        message=exc.message,
        details=exc.details,
        status_code=status.HTTP_404_NOT_FOUND,
    )


@app.exception_handler(ValidationError)
async def validation_exception_handler(
    request: Request,
    exc: ValidationError,
) -> JSONResponse:
    """Handle validation errors."""
    logger.warning(f"Validation error: {exc.message}", extra={"details": exc.details})
    return create_error_response(
        code=exc.code,
        message=exc.message,
        details=exc.details,
        status_code=status.HTTP_400_BAD_REQUEST,
    )


@app.exception_handler(AuthenticationError)
async def authentication_exception_handler(
    request: Request,
    exc: AuthenticationError,
) -> JSONResponse:
    """Handle authentication errors."""
    logger.warning(f"Authentication error: {exc.message}")
    return create_error_response(
        code=exc.code,
        message=exc.message,
        details=exc.details,
        status_code=status.HTTP_401_UNAUTHORIZED,
    )


@app.exception_handler(AuthorizationError)
async def authorization_exception_handler(
    request: Request,
    exc: AuthorizationError,
) -> JSONResponse:
    """Handle authorization errors."""
    logger.warning(f"Authorization error: {exc.message}", extra={"details": exc.details})
    return create_error_response(
        code=exc.code,
        message=exc.message,
        details=exc.details,
        status_code=status.HTTP_403_FORBIDDEN,
    )


@app.exception_handler(BankingException)
async def banking_exception_handler(
    request: Request,
    exc: BankingException,
) -> JSONResponse:
    """Handle general banking exceptions."""
    logger.error(f"Banking error: {exc.message}", extra={"details": exc.details})
    return create_error_response(
        code=exc.code,
        message=exc.message,
        details=exc.details,
        status_code=status.HTTP_400_BAD_REQUEST,
    )


@app.exception_handler(RequestValidationError)
async def request_validation_exception_handler(
    request: Request,
    exc: RequestValidationError,
) -> JSONResponse:
    """Handle Pydantic validation errors."""
    errors = []
    for error in exc.errors():
        errors.append(
            {
                "field": ".".join(str(loc) for loc in error["loc"]),
                "message": error["msg"],
            }
        )
    logger.warning("Request validation error", extra={"errors": errors})
    return create_error_response(
        code="VALIDATION_ERROR",
        message="Invalid request data",
        details={"errors": errors},
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
    )


@app.exception_handler(Exception)
async def general_exception_handler(
    request: Request,
    exc: Exception,
) -> JSONResponse:
    """Handle unexpected errors."""
    logger.exception(f"Unexpected error: {str(exc)}")
    return create_error_response(
        code="INTERNAL_ERROR",
        message="An unexpected error occurred",
        details={},
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
    )


# Include API router
app.include_router(api_router, prefix="/api/v1")
