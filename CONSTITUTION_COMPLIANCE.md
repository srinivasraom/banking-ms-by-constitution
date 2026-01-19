# Constitution Compliance Report

**Banking Microservices Application**
**Generated**: 2026-01-17
**Constitution Version**: 1.0.0

This document maps the constitution principles defined in `.specify/memory/constitution.md` to their implementations in the codebase.

---

## I. Security-First (CWE/MITRE Top 25)

### CWE-522 (Insufficiently Protected Credentials) - Password Hashing with Bcrypt

| File | Line | Description |
|------|------|-------------|
| [backend/app/core/security.py](backend/app/core/security.py) | 14 | CryptContext configured with bcrypt: `pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")` |
| [backend/app/core/security.py](backend/app/core/security.py) | 17-19 | `verify_password()` - Verifies plain password against bcrypt hash |
| [backend/app/core/security.py](backend/app/core/security.py) | 22-24 | `get_password_hash()` - Hashes password using bcrypt |

### CWE-287 (Improper Authentication) - JWT/OAuth2 Authentication

| File | Line | Description |
|------|------|-------------|
| [backend/app/core/security.py](backend/app/core/security.py) | 27-41 | `create_access_token()` - Creates JWT with expiration claim |
| [backend/app/core/security.py](backend/app/core/security.py) | 44-56 | `create_refresh_token()` - Creates refresh JWT with extended expiry |
| [backend/app/core/security.py](backend/app/core/security.py) | 59-65 | `decode_token()` - Validates and decodes JWT tokens |
| [backend/app/core/security.py](backend/app/core/security.py) | 68-73 | `verify_access_token()` - Validates access token type |
| [backend/app/core/security.py](backend/app/core/security.py) | 76-81 | `verify_refresh_token()` - Validates refresh token type |
| [backend/app/api/deps.py](backend/app/api/deps.py) | 17 | OAuth2 bearer scheme: `OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")` |
| [backend/app/api/deps.py](backend/app/api/deps.py) | 35-50 | `get_current_customer_id()` - Extracts and validates customer ID from JWT |
| [backend/app/api/deps.py](backend/app/api/deps.py) | 53-77 | `get_current_customer()` - Retrieves authenticated customer from database |

### CWE-862/863 (Missing/Incorrect Authorization)

| File | Line | Description |
|------|------|-------------|
| [backend/app/services/account_service.py](backend/app/services/account_service.py) | 102-108 | Authorization check verifies customer owns account before access |
| [backend/app/services/transaction_service.py](backend/app/services/transaction_service.py) | 54-56 | Authorization check verifies customer has access to account |

### CWE-352 (CSRF) - CORS Configuration

| File | Line | Description |
|------|------|-------------|
| [backend/app/main.py](backend/app/main.py) | 47-55 | CORSMiddleware configured with allowed origins, credentials, methods, headers |
| [backend/app/config.py](backend/app/config.py) | 34 | CORS origins whitelist: `["http://localhost:3000", "http://localhost:4002", "http://localhost:5173"]` |

---

## II. Input Validation & Sanitization

### CWE-20 (Improper Input Validation) - Pydantic Validators

| File | Line | Description |
|------|------|-------------|
| [backend/app/schemas/customer.py](backend/app/schemas/customer.py) | 12-49 | `CustomerCreate` schema with field constraints (min_length, max_length, email validation) |
| [backend/app/schemas/customer.py](backend/app/schemas/customer.py) | 28-35 | Phone validation using E.164 regex pattern |
| [backend/app/schemas/customer.py](backend/app/schemas/customer.py) | 37-49 | Age verification validator (18+ requirement) |
| [backend/app/schemas/account.py](backend/app/schemas/account.py) | 12-29 | `AccountCreate` schema with decimal validation |
| [backend/app/schemas/account.py](backend/app/schemas/account.py) | 25-29 | Decimal places validator (exactly 2 decimal places) |
| [backend/app/schemas/transaction.py](backend/app/schemas/transaction.py) | 12-39 | `TransactionCreate` with amount and type validation |
| [backend/app/schemas/transaction.py](backend/app/schemas/transaction.py) | 33-39 | Transaction type whitelist (deposit/withdrawal only) |
| [backend/app/schemas/auth.py](backend/app/schemas/auth.py) | 6-10 | `LoginRequest` with EmailStr validation |

### Server-Side Validation & Sanitization

| File | Line | Description |
|------|------|-------------|
| [backend/app/services/customer_service.py](backend/app/services/customer_service.py) | 60, 110 | Email lowercased for consistency |
| [backend/app/main.py](backend/app/main.py) | 172-192 | Request validation error handler with field-level details |

---

## III. SQL Injection Prevention (CWE-89)

All database queries use SQLAlchemy ORM with parameterized queries - no raw SQL string concatenation.

| File | Line | Description |
|------|------|-------------|
| [backend/app/services/customer_service.py](backend/app/services/customer_service.py) | 30, 40, 46 | Uses `select()` with `.where()` clauses |
| [backend/app/services/customer_service.py](backend/app/services/customer_service.py) | 60, 110, 118, 187-190 | Parameterized queries for customer operations |
| [backend/app/services/account_service.py](backend/app/services/account_service.py) | 50, 55, 96, 116-119, 234-237 | Uses `select()` with `.where()` and `.order_by()` |
| [backend/app/services/transaction_service.py](backend/app/services/transaction_service.py) | 45-47, 82, 87, 146, 186, 218-225 | Parameterized queries with `and_()` for conditions |
| [backend/app/services/transaction_service.py](backend/app/services/transaction_service.py) | 47 | Uses `.with_for_update()` for transactional locking |

---

## IV. Secure Data Handling

### CWE-532 (Log Injection) - Sensitive Data Filtering

| File | Line | Description |
|------|------|-------------|
| [backend/app/core/logging.py](backend/app/core/logging.py) | 50 | Sensitive fields defined: password, token, secret, authorization, ssn, pan |
| [backend/app/core/logging.py](backend/app/core/logging.py) | 54-55 | Filters sensitive fields from log output |

### CWE-200 (Information Exposure) - Error Handling

| File | Line | Description |
|------|------|-------------|
| [backend/app/main.py](backend/app/main.py) | 78-94 | `create_error_response()` - Standardized error responses without internals |
| [backend/app/main.py](backend/app/main.py) | 195-207 | General exception handler - hides stack traces from users |

---

## V. API Contract-First Design

### API Versioning

| File | Line | Description |
|------|------|-------------|
| [backend/app/main.py](backend/app/main.py) | 211 | API router mounted with version prefix: `app.include_router(api_router, prefix="/api/v1")` |
| [backend/app/api/v1/router.py](backend/app/api/v1/router.py) | 1-15 | Central router includes all versioned endpoints |

### OpenAPI Documentation

| File | Line | Description |
|------|------|-------------|
| [backend/app/main.py](backend/app/main.py) | 37-45 | FastAPI app with OpenAPI documentation enabled at `/docs` and `/redoc` |

---

## VI. Resilience & Fault Tolerance

### Health Checks

| File | Line | Description |
|------|------|-------------|
| [backend/app/api/v1/health.py](backend/app/api/v1/health.py) | 16-26 | `GET /health` - Liveness check returns status, version, timestamp |
| [backend/app/api/v1/health.py](backend/app/api/v1/health.py) | 29-47 | `GET /health/ready` - Readiness check verifies database connectivity |

### CWE-613 (Session Expiration) - Token Timeouts

| File | Line | Description |
|------|------|-------------|
| [backend/app/config.py](backend/app/config.py) | 30 | Access token expiration: 15 minutes |
| [backend/app/config.py](backend/app/config.py) | 31 | Refresh token expiration: 7 days |
| [backend/app/core/security.py](backend/app/core/security.py) | 33-38 | Access token `exp` claim calculation |
| [backend/app/core/security.py](backend/app/core/security.py) | 50-54 | Refresh token `exp` claim calculation |

---

## VII. Observability & Auditability

### Structured JSON Logging

| File | Line | Description |
|------|------|-------------|
| [backend/app/core/logging.py](backend/app/core/logging.py) | 31-58 | `JSONFormatter` class - Outputs structured JSON logs |
| [backend/app/core/logging.py](backend/app/core/logging.py) | 36-43 | Log fields: timestamp, level, logger, message, correlation_id, service name |
| [backend/app/core/logging.py](backend/app/core/logging.py) | 46-47 | Exception info included when present |

### Correlation ID (Distributed Tracing)

| File | Line | Description |
|------|------|-------------|
| [backend/app/core/logging.py](backend/app/core/logging.py) | 14 | ContextVar for correlation ID storage |
| [backend/app/core/logging.py](backend/app/core/logging.py) | 17-23 | `get_correlation_id()` - Gets or generates UUID correlation ID |
| [backend/app/core/logging.py](backend/app/core/logging.py) | 26-28 | `set_correlation_id()` - Sets correlation ID in context |
| [backend/app/main.py](backend/app/main.py) | 59-74 | Correlation ID middleware - Extracts from header or generates |
| [backend/app/main.py](backend/app/main.py) | 73 | Adds X-Correlation-ID to response headers |
| [backend/app/api/deps.py](backend/app/api/deps.py) | 26-32 | `get_correlation_id_header()` dependency |

### Audit Trail

| File | Line | Description |
|------|------|-------------|
| [backend/app/models/audit_log.py](backend/app/models/audit_log.py) | 14-20 | `AuditAction` enum: CREATE, READ, UPDATE, DELETE |
| [backend/app/models/audit_log.py](backend/app/models/audit_log.py) | 23-54 | `AuditLog` model with fields for who, what, when, where |
| [backend/app/models/audit_log.py](backend/app/models/audit_log.py) | 33-35 | Correlation ID field (indexed) |
| [backend/app/models/audit_log.py](backend/app/models/audit_log.py) | 36-40 | Customer ID reference (indexed) |
| [backend/app/models/audit_log.py](backend/app/models/audit_log.py) | 47 | JSON details field for flexible metadata |
| [backend/app/models/audit_log.py](backend/app/models/audit_log.py) | 48-49 | IP address and User-Agent tracking |

### Audit Logging Implementations

| File | Line | Description |
|------|------|-------------|
| [backend/app/services/customer_service.py](backend/app/services/customer_service.py) | 91-99 | Audit log for customer registration |
| [backend/app/services/customer_service.py](backend/app/services/customer_service.py) | 163-171 | Audit log for profile updates |
| [backend/app/services/customer_service.py](backend/app/services/customer_service.py) | 204-212 | Audit log for account deactivation |
| [backend/app/services/account_service.py](backend/app/services/account_service.py) | 70-81 | Audit log for account creation |
| [backend/app/services/transaction_service.py](backend/app/services/transaction_service.py) | 100-117 | Audit log for transactions |
| [backend/app/api/v1/auth.py](backend/app/api/v1/auth.py) | 87-96 | Audit log for login |
| [backend/app/api/v1/auth.py](backend/app/api/v1/auth.py) | 147-156 | Audit log for token refresh |

---

## VIII. Additional Security Controls

### CWE-798 (Hardcoded Credentials) - Environment Configuration

| File | Line | Description |
|------|------|-------------|
| [backend/app/config.py](backend/app/config.py) | 12-16 | Pydantic Settings loads from environment variables and `.env` file |
| [backend/app/config.py](backend/app/config.py) | 24-25 | Database URL from environment (defaults to SQLite for dev) |
| [backend/app/config.py](backend/app/config.py) | 28 | Secret key from environment |

### Gitignore for Secrets

| File | Line | Description |
|------|------|-------------|
| [.gitignore](.gitignore) | 92-96 | Excludes: .pem, .key, secrets/, credentials/ |
| [.gitignore](.gitignore) | 79-82 | Excludes: *.db, *.sqlite, *.sqlite3 |

---

## Summary

| Principle | Status | Key Files |
|-----------|--------|-----------|
| I. Security-First | Implemented | security.py, deps.py, main.py |
| II. Input Validation | Implemented | schemas/*.py, main.py |
| III. SQL Injection Prevention | Implemented | All services use SQLAlchemy ORM |
| IV. Secure Data Handling | Implemented | logging.py, main.py |
| V. API Contract-First | Implemented | main.py, router.py |
| VI. Resilience | Implemented | health.py, config.py |
| VII. Observability | Implemented | logging.py, audit_log.py |
| VIII. Additional Controls | Implemented | config.py, .gitignore |

---

*This document is auto-generated from codebase analysis. For the full constitution, see [.specify/memory/constitution.md](.specify/memory/constitution.md).*
