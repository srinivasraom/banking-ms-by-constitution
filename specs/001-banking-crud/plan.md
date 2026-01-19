# Implementation Plan: Banking Microservices CRUD Operations

**Branch**: `001-banking-crud` | **Date**: 2026-01-16 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-banking-crud/spec.md`

## Summary

Build a banking microservices application with RESTful APIs for managing customers, accounts, and transactions. The backend uses Python/FastAPI with Pydantic validation, PostgreSQL for persistence, and exposes OpenAPI documentation. A React-based frontend provides a user interface for all CRUD operations, communicating with the backend via REST APIs.

## Technical Context

**Language/Version**: Python 3.11+ (backend), TypeScript 5.x (frontend)
**Primary Dependencies**:
- Backend: FastAPI, Pydantic v2, SQLAlchemy 2.0, Alembic, uvicorn
- Frontend: React 18, TypeScript, React Query, React Router, Axios
**Storage**: PostgreSQL 15+ with SQLAlchemy ORM
**Testing**: pytest (backend), Jest + React Testing Library (frontend)
**Target Platform**: Linux server (Docker containers), modern web browsers
**Project Type**: Web application (frontend + backend)
**Performance Goals**: 100 concurrent users, <200ms p95 response time
**Constraints**: <2s page load, TLS required, audit logging mandatory
**Scale/Scope**: Initial MVP for demonstration, scalable architecture

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Requirement | Compliance |
|-----------|-------------|------------|
| **I. Security-First** | CWE/MITRE Top 25 prevention | ✅ Pydantic validation, SQLAlchemy ORM (no raw SQL), parameterized queries |
| **II. Input Validation** | Strict input schemas | ✅ Pydantic models with validators for all endpoints |
| **III. Auth & AuthZ** | OAuth2/OpenID Connect, RBAC | ✅ FastAPI OAuth2 with JWT, customer-scoped access |
| **IV. Secure Data** | Encryption at rest/transit, no sensitive logging | ✅ TLS, PostgreSQL encryption, structured logging without PII |
| **V. Bounded Context** | Single responsibility, data ownership | ✅ Three microservices: Customer, Account, Transaction |
| **VI. Contract-First** | OpenAPI specs, versioning | ✅ FastAPI auto-generates OpenAPI 3.1, /v1/ prefix |
| **VII. Resilience** | Circuit breakers, timeouts, health checks | ✅ Health endpoints, async with timeouts, graceful degradation |
| **VIII. Observability** | Structured logging, tracing, metrics | ✅ JSON logging, correlation IDs, Prometheus metrics |

**Gate Status**: ✅ PASS - All constitution principles addressed

## Project Structure

### Documentation (this feature)

```text
specs/001-banking-crud/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (OpenAPI specs)
│   └── openapi.yaml     # Full OpenAPI 3.1 specification
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI application entry point
│   ├── config.py            # Configuration management
│   ├── database.py          # Database connection and session
│   ├── models/              # SQLAlchemy models
│   │   ├── __init__.py
│   │   ├── customer.py
│   │   ├── account.py
│   │   └── transaction.py
│   ├── schemas/             # Pydantic schemas
│   │   ├── __init__.py
│   │   ├── customer.py
│   │   ├── account.py
│   │   └── transaction.py
│   ├── api/                 # API routes
│   │   ├── __init__.py
│   │   ├── v1/
│   │   │   ├── __init__.py
│   │   │   ├── router.py
│   │   │   ├── customers.py
│   │   │   ├── accounts.py
│   │   │   └── transactions.py
│   │   └── deps.py          # Dependencies (auth, db session)
│   ├── services/            # Business logic
│   │   ├── __init__.py
│   │   ├── customer_service.py
│   │   ├── account_service.py
│   │   └── transaction_service.py
│   ├── core/                # Core utilities
│   │   ├── __init__.py
│   │   ├── security.py      # Auth utilities
│   │   ├── logging.py       # Structured logging
│   │   └── exceptions.py    # Custom exceptions
│   └── migrations/          # Alembic migrations
│       ├── env.py
│       └── versions/
├── tests/
│   ├── conftest.py
│   ├── unit/
│   ├── integration/
│   └── contract/
├── requirements.txt
├── Dockerfile
└── docker-compose.yml

frontend/
├── src/
│   ├── index.tsx
│   ├── App.tsx
│   ├── api/                 # API client
│   │   ├── client.ts
│   │   ├── customers.ts
│   │   ├── accounts.ts
│   │   └── transactions.ts
│   ├── components/          # Reusable components
│   │   ├── common/
│   │   │   ├── Button.tsx
│   │   │   ├── Table.tsx
│   │   │   ├── Modal.tsx
│   │   │   └── Form.tsx
│   │   ├── customers/
│   │   ├── accounts/
│   │   └── transactions/
│   ├── pages/               # Page components
│   │   ├── Dashboard.tsx
│   │   ├── Customers.tsx
│   │   ├── CustomerDetail.tsx
│   │   ├── Accounts.tsx
│   │   ├── AccountDetail.tsx
│   │   └── Transactions.tsx
│   ├── hooks/               # Custom React hooks
│   ├── types/               # TypeScript types
│   ├── utils/               # Utilities
│   └── styles/              # CSS/styling
├── public/
├── tests/
├── package.json
├── tsconfig.json
├── vite.config.ts
└── Dockerfile
```

**Structure Decision**: Web application structure with separate `backend/` and `frontend/` directories. This aligns with Constitution Principle V (Bounded Context) by maintaining clear separation between API services and UI.

## Complexity Tracking

> No constitution violations requiring justification. Architecture follows established patterns.

| Decision | Rationale |
|----------|-----------|
| Monolithic backend (single FastAPI app) | MVP scope; services are logically separated but deployed together initially for simplicity |
| SQLAlchemy ORM | Prevents SQL injection (CWE-89), provides migration support via Alembic |
| Pydantic v2 | Strict input validation (CWE-20), automatic OpenAPI schema generation |
| React Query | Handles caching, refetching, and error states for API calls |
