"""Custom exception classes for the banking application."""

from typing import Any, Dict, Optional


class BankingException(Exception):
    """Base exception for banking application."""

    def __init__(
        self,
        message: str,
        code: str = "INTERNAL_ERROR",
        details: Optional[Dict[str, Any]] = None,
    ) -> None:
        self.message = message
        self.code = code
        self.details = details or {}
        super().__init__(self.message)


class NotFoundError(BankingException):
    """Resource not found exception."""

    def __init__(
        self,
        resource: str,
        identifier: str,
        details: Optional[Dict[str, Any]] = None,
    ) -> None:
        super().__init__(
            message=f"{resource} with identifier '{identifier}' not found",
            code="NOT_FOUND",
            details=details or {"resource": resource, "identifier": identifier},
        )


class ValidationError(BankingException):
    """Input validation exception."""

    def __init__(
        self,
        message: str,
        field: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
    ) -> None:
        error_details = details or {}
        if field:
            error_details["field"] = field
        super().__init__(
            message=message,
            code="VALIDATION_ERROR",
            details=error_details,
        )


class AuthorizationError(BankingException):
    """Authorization/permission exception."""

    def __init__(
        self,
        message: str = "You do not have permission to access this resource",
        details: Optional[Dict[str, Any]] = None,
    ) -> None:
        super().__init__(
            message=message,
            code="FORBIDDEN",
            details=details or {},
        )


class AuthenticationError(BankingException):
    """Authentication exception."""

    def __init__(
        self,
        message: str = "Invalid or expired authentication credentials",
        details: Optional[Dict[str, Any]] = None,
    ) -> None:
        super().__init__(
            message=message,
            code="UNAUTHORIZED",
            details=details or {},
        )


class InsufficientFundsError(BankingException):
    """Insufficient funds for transaction exception."""

    def __init__(
        self,
        account_number: str,
        requested_amount: str,
        available_balance: str,
        details: Optional[Dict[str, Any]] = None,
    ) -> None:
        error_details = details or {}
        error_details.update(
            {
                "account_number": account_number,
                "requested_amount": requested_amount,
                "available_balance": available_balance,
            }
        )
        super().__init__(
            message="Insufficient funds for this transaction",
            code="INSUFFICIENT_FUNDS",
            details=error_details,
        )


class DuplicateResourceError(BankingException):
    """Duplicate resource exception."""

    def __init__(
        self,
        resource: str,
        field: str,
        value: str,
        details: Optional[Dict[str, Any]] = None,
    ) -> None:
        error_details = details or {}
        error_details.update({"resource": resource, "field": field, "value": value})
        super().__init__(
            message=f"{resource} with {field} '{value}' already exists",
            code="CONFLICT",
            details=error_details,
        )


class AccountClosureError(BankingException):
    """Account closure not allowed exception."""

    def __init__(
        self,
        account_number: str,
        reason: str,
        details: Optional[Dict[str, Any]] = None,
    ) -> None:
        error_details = details or {}
        error_details.update({"account_number": account_number, "reason": reason})
        super().__init__(
            message=f"Cannot close account: {reason}",
            code="ACCOUNT_CLOSURE_ERROR",
            details=error_details,
        )


class CustomerDeactivationError(BankingException):
    """Customer deactivation not allowed exception."""

    def __init__(
        self,
        customer_id: str,
        reason: str,
        details: Optional[Dict[str, Any]] = None,
    ) -> None:
        error_details = details or {}
        error_details.update({"customer_id": customer_id, "reason": reason})
        super().__init__(
            message=f"Cannot deactivate customer: {reason}",
            code="CUSTOMER_DEACTIVATION_ERROR",
            details=error_details,
        )
