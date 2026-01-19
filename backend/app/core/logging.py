"""Structured JSON logging with correlation ID support."""

import json
import logging
import sys
import uuid
from contextvars import ContextVar
from datetime import datetime, timezone
from typing import Any, Dict, Optional

from app.config import settings

# Context variable for correlation ID
correlation_id_var: ContextVar[Optional[str]] = ContextVar("correlation_id", default=None)


def get_correlation_id() -> str:
    """Get current correlation ID or generate a new one."""
    cid = correlation_id_var.get()
    if cid is None:
        cid = str(uuid.uuid4())
        correlation_id_var.set(cid)
    return cid


def set_correlation_id(cid: str) -> None:
    """Set the correlation ID for the current context."""
    correlation_id_var.set(cid)


class JSONFormatter(logging.Formatter):
    """JSON formatter for structured logging."""

    def format(self, record: logging.LogRecord) -> str:
        """Format log record as JSON."""
        log_data: Dict[str, Any] = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "correlation_id": get_correlation_id(),
            "service": settings.app_name,
        }

        # Add exception info if present
        if record.exc_info:
            log_data["exception"] = self.formatException(record.exc_info)

        # Add extra fields (but filter out sensitive data)
        sensitive_fields = {"password", "token", "secret", "authorization", "ssn", "pan"}
        for key, value in record.__dict__.items():
            if key not in logging.LogRecord.__dict__ and not key.startswith("_"):
                # Skip sensitive fields
                if any(s in key.lower() for s in sensitive_fields):
                    continue
                log_data[key] = value

        return json.dumps(log_data, default=str)


class StandardFormatter(logging.Formatter):
    """Standard text formatter for development."""

    def format(self, record: logging.LogRecord) -> str:
        """Format log record as text."""
        cid = get_correlation_id()
        timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
        return f"{timestamp} [{record.levelname}] [{cid[:8]}] {record.name}: {record.getMessage()}"


def setup_logging() -> logging.Logger:
    """Configure logging based on settings."""
    logger = logging.getLogger("banking")
    logger.setLevel(getattr(logging, settings.log_level.upper()))

    # Remove existing handlers
    logger.handlers.clear()

    # Create console handler
    handler = logging.StreamHandler(sys.stdout)
    handler.setLevel(getattr(logging, settings.log_level.upper()))

    # Choose formatter based on settings
    if settings.log_format.lower() == "json":
        formatter = JSONFormatter()
    else:
        formatter = StandardFormatter()

    handler.setFormatter(formatter)
    logger.addHandler(handler)

    # Prevent propagation to root logger
    logger.propagate = False

    return logger


# Create default logger
logger = setup_logging()


def log_audit(
    action: str,
    resource_type: str,
    resource_id: str,
    customer_id: Optional[str] = None,
    old_value: Optional[Dict[str, Any]] = None,
    new_value: Optional[Dict[str, Any]] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
) -> None:
    """Log audit event for compliance."""
    audit_data = {
        "audit": True,
        "action": action,
        "resource_type": resource_type,
        "resource_id": resource_id,
        "customer_id": customer_id,
        "ip_address": ip_address,
        "user_agent": user_agent,
    }

    # Don't log actual values in logs (they go to audit_logs table)
    # Just note that changes occurred
    if old_value is not None:
        audit_data["had_previous_value"] = True
    if new_value is not None:
        audit_data["has_new_value"] = True

    logger.info(f"AUDIT: {action} on {resource_type}/{resource_id}", extra=audit_data)
