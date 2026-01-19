# Research: Banking Microservices CRUD Operations

**Feature**: 001-banking-crud
**Date**: 2026-01-16
**Status**: Complete

## Technology Decisions

### Backend Framework: FastAPI

**Decision**: Use FastAPI 0.109+ with Python 3.11+

**Rationale**:
- Native async support for high concurrency (SC-004: 100 concurrent users)
- Automatic OpenAPI 3.1 schema generation (Constitution VI: Contract-First)
- Built-in Pydantic integration for request/response validation
- Dependency injection system for clean architecture
- High performance comparable to NodeJS and Go

**Alternatives Considered**:
| Alternative | Rejected Because |
|------------|------------------|
| Django REST Framework | Heavier, synchronous by default, slower for pure APIs |
| Flask | No built-in validation, requires many extensions |
| Starlette | Lower-level, would need to rebuild FastAPI features |

### Database: PostgreSQL with SQLAlchemy 2.0

**Decision**: PostgreSQL 15+ with SQLAlchemy 2.0 ORM and Alembic migrations

**Rationale**:
- ACID compliance required for financial transactions (Constitution VII)
- SQLAlchemy ORM prevents SQL injection (Constitution I: CWE-89)
- Alembic provides version-controlled schema migrations
- PostgreSQL offers encryption at rest (Constitution IV)
- Proven reliability for banking domain

**Alternatives Considered**:
| Alternative | Rejected Because |
|------------|------------------|
| MySQL | Less robust transaction support, fewer advanced features |
| MongoDB | Not suitable for transactional financial data |
| Raw SQL | Violates Constitution I (SQL injection risk) |

### Validation: Pydantic v2

**Decision**: Pydantic v2 for all input/output validation

**Rationale**:
- Strict type enforcement at API boundaries (Constitution II)
- Automatic JSON schema generation for OpenAPI
- Custom validators for business rules (email format, phone format)
- 5-50x faster than Pydantic v1
- Native support in FastAPI

**Validation Strategy**:
```
API Request → Pydantic Schema → Service Layer → SQLAlchemy Model → Database
```

### Authentication: OAuth2 with JWT

**Decision**: FastAPI OAuth2PasswordBearer with JWT tokens

**Rationale**:
- Industry standard (Constitution III: CWE-287)
- Stateless authentication scales horizontally
- JWT contains customer_id for authorization checks
- Short-lived access tokens (15 min) with refresh tokens (7 days)

**Security Measures**:
- Tokens signed with RS256 (asymmetric)
- Password hashing with bcrypt (Constitution III: CWE-522)
- Rate limiting on auth endpoints (Constitution III: CWE-307)

### Frontend: React 18 with TypeScript

**Decision**: React 18 + TypeScript + Vite + React Query

**Rationale**:
- React 18 concurrent features for responsive UI
- TypeScript catches type errors at compile time
- Vite for fast development builds
- React Query manages server state, caching, and refetching
- Large ecosystem and community support

**Alternatives Considered**:
| Alternative | Rejected Because |
|------------|------------------|
| Vue.js | Smaller ecosystem, less TypeScript maturity |
| Angular | Heavier framework, steeper learning curve |
| Next.js | SSR complexity not needed for this SPA |

### API Client: Axios with OpenAPI Types

**Decision**: Axios for HTTP client, generate types from OpenAPI spec

**Rationale**:
- Axios interceptors for auth token injection
- Generate TypeScript types from OpenAPI spec
- Request/response logging for debugging
- Automatic retry with exponential backoff

## Architecture Decisions

### Service Layer Pattern

**Decision**: Thin API routes, business logic in service layer

**Rationale**:
- Separation of concerns (API → Service → Repository)
- Services can be unit tested without HTTP
- Easy to add validation/authorization at service level

**Pattern**:
```
Route (validation) → Service (business logic) → Repository (data access)
```

### Entity Relationships

**Decision**: Customer → Account → Transaction hierarchy

**Rationale**:
- One-to-many: Customer has many Accounts
- One-to-many: Account has many Transactions
- All queries scoped by customer_id for authorization

### Audit Logging

**Decision**: Structured JSON logging with correlation IDs

**Rationale**:
- Constitution VIII: All modifications must be audit-logged
- JSON format for log aggregation (ELK, CloudWatch)
- Correlation ID tracks requests across services

**Log Fields**:
- timestamp, level, correlation_id, customer_id
- action, resource_type, resource_id
- old_value, new_value (for mutations)

### Error Handling

**Decision**: Custom exception classes with standard error response format

**Rationale**:
- Constitution IV: No system internals in error messages
- Consistent error format for frontend handling
- HTTP status codes follow REST conventions

**Error Response Format**:
```json
{
  "error": {
    "code": "INSUFFICIENT_FUNDS",
    "message": "Withdrawal amount exceeds available balance",
    "details": {}
  }
}
```

## Performance Considerations

### Database Indexing

**Indexes Required**:
- `customers.email` (unique)
- `accounts.customer_id` (foreign key lookups)
- `accounts.account_number` (unique)
- `transactions.account_id` (foreign key lookups)
- `transactions.created_at` (date range queries)

### Pagination

**Decision**: Cursor-based pagination for transaction lists

**Rationale**:
- Offset pagination breaks with large datasets
- Cursor (last transaction ID) provides consistent results
- Supports infinite scroll in frontend

### Caching Strategy

**Decision**: No application-level caching for MVP

**Rationale**:
- Financial data must be consistent
- Database query optimization first
- Add Redis caching if performance issues arise

## Security Implementation

### Input Validation Rules

| Field | Validation |
|-------|------------|
| email | RFC 5322 format, lowercase, unique |
| phone | E.164 format with optional formatting |
| amount | Decimal, positive, max 2 decimal places |
| account_type | Enum: checking, savings |
| date_of_birth | ISO 8601, must be 18+ years ago |

### Authorization Model

```
Customer can only access:
- Their own profile (customer_id = jwt.customer_id)
- Their own accounts (account.customer_id = jwt.customer_id)
- Transactions on their own accounts
```

### Rate Limiting

| Endpoint Category | Limit |
|-------------------|-------|
| Authentication | 5 requests/minute |
| Read operations | 100 requests/minute |
| Write operations | 30 requests/minute |

## Open Questions Resolved

| Question | Resolution |
|----------|------------|
| Single vs multi-currency | Single currency (USD) for MVP per spec assumptions |
| Inter-account transfers | Out of scope per spec assumptions |
| Interest calculations | Out of scope per spec assumptions |
| Mobile app | Out of scope; web frontend only |
