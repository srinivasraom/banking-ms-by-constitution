# Tasks: Banking Microservices CRUD Operations

**Input**: Design documents from `/specs/001-banking-crud/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/openapi.yaml

**Tests**: Tests are included as this is a banking application requiring high reliability.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Backend**: `backend/app/` for source, `backend/tests/` for tests
- **Frontend**: `frontend/src/` for source, `frontend/tests/` for tests

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure for both backend and frontend

### Backend Setup

- [ ] T001 Create backend project structure with directories: `backend/app/{models,schemas,api,services,core,migrations}` and `backend/tests/{unit,integration,contract}`
- [ ] T002 Initialize Python project with `backend/requirements.txt` including FastAPI, Pydantic v2, SQLAlchemy 2.0, Alembic, uvicorn, python-jose, passlib, bcrypt
- [ ] T003 [P] Create `backend/app/config.py` with environment variable configuration using pydantic-settings
- [ ] T004 [P] Create `backend/.env.example` with template environment variables (DATABASE_URL, SECRET_KEY, etc.)
- [ ] T005 [P] Configure linting with `backend/pyproject.toml` (ruff, black, mypy settings)

### Frontend Setup

- [ ] T006 [P] Initialize React project with Vite and TypeScript in `frontend/` using `npm create vite@latest`
- [ ] T007 [P] Install frontend dependencies: react-query, react-router-dom, axios, tailwindcss in `frontend/package.json`
- [ ] T008 [P] Configure TypeScript with strict mode in `frontend/tsconfig.json`
- [ ] T009 [P] Setup Tailwind CSS configuration in `frontend/tailwind.config.js` and `frontend/src/styles/index.css`
- [ ] T010 [P] Create `frontend/.env.example` with VITE_API_URL template

### Docker Setup

- [ ] T011 [P] Create `backend/Dockerfile` for Python FastAPI application
- [ ] T012 [P] Create `frontend/Dockerfile` for React build and nginx serving
- [ ] T013 Create `docker-compose.yml` at project root with PostgreSQL, backend, and frontend services

**Checkpoint**: Project scaffolding complete - both projects can start and run empty shells

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Database Foundation

- [ ] T014 Create `backend/app/database.py` with SQLAlchemy async engine, session maker, and Base class
- [ ] T015 Initialize Alembic migrations with `backend/app/migrations/env.py` configured for async SQLAlchemy
- [ ] T016 Create initial migration for enum types (customer_status, account_type, account_status, transaction_type, audit_action) in `backend/app/migrations/versions/001_enums.py`

### Core Utilities

- [ ] T017 [P] Create `backend/app/core/exceptions.py` with custom exception classes (NotFoundError, ValidationError, AuthorizationError, InsufficientFundsError)
- [ ] T018 [P] Create `backend/app/core/logging.py` with structured JSON logging and correlation ID middleware
- [ ] T019 [P] Create `backend/app/models/audit_log.py` with AuditLog SQLAlchemy model for compliance logging

### Authentication Framework

- [ ] T020 Create `backend/app/core/security.py` with JWT token creation/verification, password hashing (bcrypt), and OAuth2 scheme
- [ ] T021 Create `backend/app/schemas/auth.py` with LoginRequest, TokenResponse, and RefreshTokenRequest Pydantic schemas
- [ ] T022 Create `backend/app/api/deps.py` with get_db dependency, get_current_customer dependency using JWT verification

### API Foundation

- [ ] T023 Create `backend/app/main.py` with FastAPI app, CORS middleware, exception handlers, and router includes
- [ ] T024 Create `backend/app/api/v1/router.py` with APIRouter including all v1 endpoints
- [ ] T025 Create `backend/app/api/v1/health.py` with `/health` and `/health/ready` endpoints

### Frontend Foundation

- [ ] T026 Create `frontend/src/api/client.ts` with Axios instance, auth token interceptor, and error handling
- [ ] T027 Create `frontend/src/types/index.ts` with TypeScript interfaces matching OpenAPI schemas (Customer, Account, Transaction, Error)
- [ ] T028 Create `frontend/src/App.tsx` with React Router setup and authentication context provider
- [ ] T029 [P] Create `frontend/src/components/common/Button.tsx` reusable button component with variants
- [ ] T030 [P] Create `frontend/src/components/common/Table.tsx` reusable data table component with pagination
- [ ] T031 [P] Create `frontend/src/components/common/Modal.tsx` reusable modal dialog component
- [ ] T032 [P] Create `frontend/src/components/common/Form.tsx` reusable form components (Input, Select, DatePicker)
- [ ] T033 Create `frontend/src/hooks/useAuth.ts` with authentication state management and token storage
- [ ] T034 Create `frontend/src/pages/Login.tsx` with login form and registration link
- [ ] T035 Create `frontend/src/pages/Register.tsx` with customer registration form

**Checkpoint**: Foundation ready - authentication works, database connects, both apps start. User story implementation can now begin.

---

## Phase 3: User Story 1 - Account Management (Priority: P1) 🎯 MVP

**Goal**: Enable customers to create, view, update, and close bank accounts

**Independent Test**: Create a checking account with $1000, view details, update nickname, withdraw to $0, close account

### Backend - Models & Schemas for US1

- [ ] T036 [P] [US1] Create `backend/app/models/customer.py` with Customer SQLAlchemy model (required for account foreign key)
- [ ] T037 [P] [US1] Create `backend/app/models/account.py` with Account SQLAlchemy model including balance constraints
- [ ] T038 Create Alembic migration for customers and accounts tables in `backend/app/migrations/versions/002_customers_accounts.py`
- [ ] T039 [P] [US1] Create `backend/app/schemas/account.py` with AccountCreate, AccountUpdate, AccountResponse Pydantic schemas

### Backend - Services for US1

- [ ] T040 [US1] Create `backend/app/services/account_service.py` with create_account, get_account, get_accounts, update_account, close_account methods
- [ ] T041 [US1] Add account number generation logic (16-digit with bank prefix) to account_service.py
- [ ] T042 [US1] Add authorization checks (customer can only access own accounts) to account_service.py

### Backend - API Endpoints for US1

- [ ] T043 [US1] Create `backend/app/api/v1/accounts.py` with POST /accounts endpoint for account creation
- [ ] T044 [US1] Add GET /accounts endpoint to list customer's accounts with status filter
- [ ] T045 [US1] Add GET /accounts/{account_number} endpoint to get account details
- [ ] T046 [US1] Add PATCH /accounts/{account_number} endpoint to update account settings
- [ ] T047 [US1] Add DELETE /accounts/{account_number} endpoint to close account (requires zero balance)
- [ ] T048 [US1] Add audit logging for all account operations in accounts.py

### Frontend - API Client for US1

- [ ] T049 [P] [US1] Create `frontend/src/api/accounts.ts` with API functions: createAccount, getAccounts, getAccount, updateAccount, closeAccount

### Frontend - Components for US1

- [ ] T050 [P] [US1] Create `frontend/src/components/accounts/AccountCard.tsx` displaying account summary (number, type, balance, status)
- [ ] T051 [P] [US1] Create `frontend/src/components/accounts/AccountForm.tsx` for creating new accounts (type selection, initial deposit, nickname)
- [ ] T052 [P] [US1] Create `frontend/src/components/accounts/AccountSettings.tsx` for editing account nickname and notification preferences

### Frontend - Pages for US1

- [ ] T053 [US1] Create `frontend/src/pages/Accounts.tsx` with account list, create account button, and account cards
- [ ] T054 [US1] Create `frontend/src/pages/AccountDetail.tsx` with account info, settings form, and close account action
- [ ] T055 [US1] Add accounts route to `frontend/src/App.tsx` router configuration

**Checkpoint**: User Story 1 complete - Customer can create, view, update, and close accounts. MVP deliverable.

---

## Phase 4: User Story 2 - Customer Profile Management (Priority: P2)

**Goal**: Enable customers to view and update their personal profile information

**Independent Test**: Register new customer, view profile, update phone number, attempt deactivation (blocked by active accounts)

### Backend - Schemas for US2

- [ ] T056 [P] [US2] Create `backend/app/schemas/customer.py` with CustomerCreate, CustomerUpdate, CustomerResponse Pydantic schemas with validators (email, phone E.164, age 18+)

### Backend - Services for US2

- [ ] T057 [US2] Create `backend/app/services/customer_service.py` with register_customer, get_customer, update_customer, deactivate_customer methods
- [ ] T058 [US2] Add customer_id generation logic (CUST prefix + sequential number) to customer_service.py
- [ ] T059 [US2] Add deactivation check (no active accounts required) to customer_service.py

### Backend - API Endpoints for US2

- [ ] T060 [US2] Create `backend/app/api/v1/auth.py` with POST /auth/register endpoint using customer_service
- [ ] T061 [US2] Add POST /auth/login endpoint with credential verification and JWT token generation
- [ ] T062 [US2] Add POST /auth/refresh endpoint for token refresh
- [ ] T063 [US2] Create `backend/app/api/v1/customers.py` with GET /customers/me endpoint
- [ ] T064 [US2] Add PUT /customers/me endpoint to update profile
- [ ] T065 [US2] Add DELETE /customers/me endpoint to deactivate profile (checks for active accounts)
- [ ] T066 [US2] Add audit logging for all customer operations

### Frontend - API Client for US2

- [ ] T067 [P] [US2] Create `frontend/src/api/customers.ts` with API functions: getProfile, updateProfile, deactivateProfile
- [ ] T068 [P] [US2] Create `frontend/src/api/auth.ts` with API functions: register, login, refresh, logout

### Frontend - Components for US2

- [ ] T069 [P] [US2] Create `frontend/src/components/customers/ProfileForm.tsx` for viewing/editing customer profile
- [ ] T070 [P] [US2] Create `frontend/src/components/customers/AddressForm.tsx` for address fields (reusable in registration and profile)

### Frontend - Pages for US2

- [ ] T071 [US2] Update `frontend/src/pages/Register.tsx` with full customer registration form using CustomerCreate schema
- [ ] T072 [US2] Create `frontend/src/pages/Profile.tsx` with profile display, edit form, and deactivate button
- [ ] T073 [US2] Add profile route to `frontend/src/App.tsx` router configuration

**Checkpoint**: User Story 2 complete - Customer can register, login, view/update profile, and deactivate account.

---

## Phase 5: User Story 3 - Transaction Recording (Priority: P3)

**Goal**: Enable customers to make deposits/withdrawals and view transaction history

**Independent Test**: Deposit $500, withdraw $200, view transaction history, filter by date range

### Backend - Models & Schemas for US3

- [ ] T074 [P] [US3] Create `backend/app/models/transaction.py` with Transaction SQLAlchemy model (immutable, no update/delete)
- [ ] T075 Create Alembic migration for transactions table in `backend/app/migrations/versions/003_transactions.py`
- [ ] T076 [P] [US3] Create `backend/app/schemas/transaction.py` with TransactionCreate, TransactionResponse, TransactionListResponse Pydantic schemas

### Backend - Services for US3

- [ ] T077 [US3] Create `backend/app/services/transaction_service.py` with create_transaction, get_transaction, get_transactions methods
- [ ] T078 [US3] Add transaction reference generation logic (TXN prefix + timestamp + random) to transaction_service.py
- [ ] T079 [US3] Implement atomic balance update (transaction + account balance in single DB transaction)
- [ ] T080 [US3] Add insufficient funds check for withdrawals in transaction_service.py
- [ ] T081 [US3] Add cursor-based pagination for transaction history

### Backend - API Endpoints for US3

- [ ] T082 [US3] Create `backend/app/api/v1/transactions.py` with POST /accounts/{account_number}/transactions endpoint
- [ ] T083 [US3] Add GET /accounts/{account_number}/transactions endpoint with date filters and pagination
- [ ] T084 [US3] Add GET /accounts/{account_number}/transactions/{reference} endpoint for single transaction
- [ ] T085 [US3] Add audit logging for all transaction operations

### Frontend - API Client for US3

- [ ] T086 [P] [US3] Create `frontend/src/api/transactions.ts` with API functions: createTransaction, getTransactions, getTransaction

### Frontend - Components for US3

- [ ] T087 [P] [US3] Create `frontend/src/components/transactions/TransactionForm.tsx` for deposit/withdrawal form (type, amount, description)
- [ ] T088 [P] [US3] Create `frontend/src/components/transactions/TransactionList.tsx` displaying transaction history with pagination
- [ ] T089 [P] [US3] Create `frontend/src/components/transactions/TransactionFilters.tsx` with date range and type filters

### Frontend - Pages for US3

- [ ] T090 [US3] Create `frontend/src/pages/Transactions.tsx` with transaction list, filters, and new transaction modal
- [ ] T091 [US3] Update `frontend/src/pages/AccountDetail.tsx` to include recent transactions and deposit/withdraw buttons
- [ ] T092 [US3] Add transactions route to `frontend/src/App.tsx` router configuration

**Checkpoint**: User Story 3 complete - Customer can make deposits/withdrawals and view transaction history with filters.

---

## Phase 6: Dashboard & Integration

**Goal**: Create unified dashboard and ensure all features work together

### Backend - Dashboard Support

- [ ] T093 [US1] Add account summary endpoint with total balance aggregation to `backend/app/api/v1/accounts.py`

### Frontend - Dashboard

- [ ] T094 Create `frontend/src/pages/Dashboard.tsx` with account overview cards, recent transactions, and quick actions
- [ ] T095 Update `frontend/src/App.tsx` with dashboard as default authenticated route
- [ ] T096 Create `frontend/src/components/common/Navigation.tsx` with sidebar/header navigation

**Checkpoint**: Full application integrated - dashboard provides overview of all features.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Quality improvements, documentation, and production readiness

### Testing

- [ ] T097 [P] Create `backend/tests/conftest.py` with test database fixtures and async client setup
- [ ] T098 [P] Create `backend/tests/unit/test_account_service.py` with account service unit tests
- [ ] T099 [P] Create `backend/tests/unit/test_transaction_service.py` with transaction service unit tests
- [ ] T100 [P] Create `backend/tests/integration/test_accounts_api.py` with account endpoint integration tests
- [ ] T101 [P] Create `backend/tests/integration/test_transactions_api.py` with transaction endpoint integration tests
- [ ] T102 [P] Create `frontend/tests/components/AccountCard.test.tsx` with React Testing Library tests

### Documentation & DevOps

- [ ] T103 [P] Update `docker-compose.yml` with health checks and proper networking
- [ ] T104 [P] Create `backend/app/api/v1/openapi.py` to customize OpenAPI metadata and examples
- [ ] T105 Validate quickstart.md scenarios work end-to-end
- [ ] T106 [P] Add rate limiting middleware to `backend/app/main.py` per API documentation

### Security Hardening

- [ ] T107 Add CORS configuration validation in `backend/app/main.py`
- [ ] T108 Add request validation for path parameters (account_number format) in API routes
- [ ] T109 Review and sanitize all log outputs to ensure no PII leakage

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Setup) ──────────────────────────────────────────────────────────►
                 │
                 ▼
Phase 2 (Foundational) ───────────────────────────────────────────────────►
                         │
                         ▼
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
Phase 3 (US1)     Phase 4 (US2)    Phase 5 (US3)
Account Mgmt      Customer Prof    Transactions
   P1 MVP            P2               P3
        │                │                │
        └────────────────┼────────────────┘
                         │
                         ▼
               Phase 6 (Dashboard)
                         │
                         ▼
               Phase 7 (Polish)
```

### User Story Dependencies

- **User Story 1 (P1)**: Depends on Foundational (Phase 2) - Can start immediately after
- **User Story 2 (P2)**: Depends on Foundational (Phase 2) - Shares Customer model with US1, can proceed in parallel
- **User Story 3 (P3)**: Depends on Foundational (Phase 2) AND requires Account model from US1 - Should follow US1

### Within Each User Story

1. Models and migrations first (can be parallel within story)
2. Schemas (can be parallel with models)
3. Services (depends on models)
4. API endpoints (depends on services)
5. Frontend API client (depends on API endpoints)
6. Frontend components (can be parallel)
7. Frontend pages (depends on components)

---

## Parallel Execution Examples

### Phase 1 Setup - All Independent

```bash
# Launch all setup tasks in parallel:
T003: backend/app/config.py
T004: backend/.env.example
T005: backend/pyproject.toml
T006: frontend/ (vite init)
T007: frontend dependencies
T008: frontend/tsconfig.json
T009: frontend tailwind
T010: frontend/.env.example
T011: backend/Dockerfile
T012: frontend/Dockerfile
```

### Phase 2 Foundational - Parallel Groups

```bash
# Group 1 - Core utilities (parallel):
T017: backend/app/core/exceptions.py
T018: backend/app/core/logging.py
T019: backend/app/models/audit_log.py

# Group 2 - Frontend common components (parallel):
T029: frontend/src/components/common/Button.tsx
T030: frontend/src/components/common/Table.tsx
T031: frontend/src/components/common/Modal.tsx
T032: frontend/src/components/common/Form.tsx
```

### Phase 3 User Story 1 - Parallel Groups

```bash
# Group 1 - Models (parallel):
T036: backend/app/models/customer.py
T037: backend/app/models/account.py

# Group 2 - Frontend components (parallel, after API client):
T050: frontend/src/components/accounts/AccountCard.tsx
T051: frontend/src/components/accounts/AccountForm.tsx
T052: frontend/src/components/accounts/AccountSettings.tsx
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T013)
2. Complete Phase 2: Foundational (T014-T035) - **CRITICAL BLOCKER**
3. Complete Phase 3: User Story 1 (T036-T055)
4. **STOP and VALIDATE**: Test account creation, viewing, updating, closing
5. Deploy/demo MVP - Customer can manage accounts

### Incremental Delivery

1. **MVP (Phase 1-3)**: Setup + Foundational + Account Management
   - Deliverable: Create/view/update/close accounts
2. **Release 2 (Phase 4)**: Add Customer Profile Management
   - Deliverable: Register, login, manage profile
3. **Release 3 (Phase 5)**: Add Transaction Recording
   - Deliverable: Deposits, withdrawals, transaction history
4. **Release 4 (Phase 6-7)**: Dashboard + Polish
   - Deliverable: Full featured, production-ready application

### Parallel Team Strategy

With 3 developers after Phase 2 complete:

- **Developer A**: User Story 1 (Account Management) - T036-T055
- **Developer B**: User Story 2 (Customer Profile) - T056-T073
- **Developer C**: Frontend common components refinement + testing setup

After US1 complete, Developer C can start US3 (depends on Account model).

---

## Task Summary

| Phase | Description | Task Count | Parallelizable |
|-------|-------------|------------|----------------|
| Phase 1 | Setup | 13 | 10 |
| Phase 2 | Foundational | 22 | 12 |
| Phase 3 | US1 - Account Management | 20 | 8 |
| Phase 4 | US2 - Customer Profile | 18 | 6 |
| Phase 5 | US3 - Transactions | 19 | 6 |
| Phase 6 | Dashboard | 4 | 0 |
| Phase 7 | Polish | 13 | 9 |
| **Total** | | **109** | **51** |

---

## Notes

- [P] tasks = different files, no dependencies within the same phase
- [USx] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- All monetary values use Decimal with 2 decimal places
- All timestamps in UTC with timezone awareness
