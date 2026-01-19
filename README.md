# Banking Microservices Application

A full-stack banking application with CRUD operations for customers, accounts, and transactions.

## Quick Start

```bash
# Start both backend and frontend
./start.sh

# Stop all services
./stop.sh
```

**Services:**
- Backend API: http://localhost:4001
- API Documentation: http://localhost:4001/docs
- Frontend: http://localhost:4002

---

## Architecture Overview

```mermaid
graph TB
    subgraph "Frontend (React + TypeScript)"
        UI[React UI<br/>Port 4002]
        RQ[React Query]
        AUTH[Auth Context]
    end

    subgraph "Backend (FastAPI + Python)"
        API[FastAPI Server<br/>Port 4001]
        MW[Middleware Layer]
        SVC[Service Layer]
        REPO[Repository Layer]
    end

    subgraph "Data Layer"
        DB[(SQLite/PostgreSQL)]
        AUDIT[(Audit Logs)]
    end

    UI --> RQ
    RQ --> API
    AUTH --> API
    API --> MW
    MW --> SVC
    SVC --> REPO
    REPO --> DB
    SVC --> AUDIT
```

---

## System Components

### Frontend Architecture

```mermaid
graph LR
    subgraph "Pages"
        LOGIN[Login]
        REG[Register]
        DASH[Dashboard]
        ACCTS[Accounts]
        ACCT[Account Detail]
        TXN[Transactions]
        PROF[Profile]
    end

    subgraph "Hooks"
        UA[useAuth]
        UAC[useAccounts]
        UT[useTransactions]
    end

    subgraph "API Client"
        AC[accounts.ts]
        AU[auth.ts]
        CU[customers.ts]
        TR[transactions.ts]
    end

    LOGIN --> UA
    REG --> UA
    ACCTS --> UAC
    ACCT --> UAC
    TXN --> UT
    PROF --> UA

    UA --> AU
    UAC --> AC
    UT --> TR
```

### Backend Architecture

```mermaid
graph TB
    subgraph "API Layer (/api/v1)"
        AUTH_EP[/auth]
        ACCT_EP[/accounts]
        CUST_EP[/customers]
        TXN_EP[/transactions]
        HEALTH_EP[/health]
    end

    subgraph "Service Layer"
        CS[CustomerService]
        AS[AccountService]
        TS[TransactionService]
    end

    subgraph "Models"
        CM[Customer]
        AM[Account]
        TM[Transaction]
        AL[AuditLog]
    end

    AUTH_EP --> CS
    ACCT_EP --> AS
    CUST_EP --> CS
    TXN_EP --> TS

    CS --> CM
    CS --> AL
    AS --> AM
    AS --> AL
    TS --> TM
    TS --> AL
```

---

## Authentication Flow

```mermaid
sequenceDiagram
    participant U as User
    participant FE as Frontend
    participant API as Backend API
    participant DB as Database

    Note over U,DB: Registration Flow
    U->>FE: Fill registration form
    FE->>API: POST /api/v1/auth/register
    API->>DB: Create customer record
    API->>DB: Create audit log
    API-->>FE: Return JWT tokens
    FE->>FE: Store tokens in localStorage
    FE-->>U: Redirect to Dashboard

    Note over U,DB: Login Flow
    U->>FE: Enter credentials
    FE->>API: POST /api/v1/auth/login
    API->>DB: Verify credentials (bcrypt)
    API->>DB: Create audit log
    API-->>FE: Return JWT tokens
    FE->>FE: Store tokens in localStorage
    FE-->>U: Redirect to Dashboard

    Note over U,DB: Token Refresh
    FE->>API: POST /api/v1/auth/refresh
    API->>API: Verify refresh token
    API-->>FE: Return new tokens
```

---

## Account Management Flow

```mermaid
sequenceDiagram
    participant U as User
    participant FE as Frontend
    participant API as Backend API
    participant DB as Database

    Note over U,DB: Create Account
    U->>FE: Click "New Account"
    FE->>FE: Show account form
    U->>FE: Select type, enter deposit
    FE->>API: POST /api/v1/accounts
    API->>API: Verify authorization
    API->>DB: Create account
    API->>DB: Create audit log
    API-->>FE: Return account details
    FE-->>U: Show success message

    Note over U,DB: View Accounts
    U->>FE: Navigate to Accounts
    FE->>API: GET /api/v1/accounts
    API->>DB: Query customer accounts
    API-->>FE: Return account list
    FE-->>U: Display accounts

    Note over U,DB: Close Account
    U->>FE: Click "Close Account"
    FE->>API: DELETE /api/v1/accounts/{id}
    API->>API: Verify zero balance
    API->>DB: Mark account closed
    API->>DB: Create audit log
    API-->>FE: Return success
    FE-->>U: Update account list
```

---

## Transaction Flow

```mermaid
sequenceDiagram
    participant U as User
    participant FE as Frontend
    participant API as Backend API
    participant DB as Database

    Note over U,DB: Deposit
    U->>FE: Click "Deposit"
    FE->>FE: Show transaction form
    U->>FE: Enter amount
    FE->>API: POST /api/v1/accounts/{id}/transactions
    API->>API: Verify authorization
    API->>DB: Lock account (FOR UPDATE)
    API->>DB: Create transaction
    API->>DB: Update balance
    API->>DB: Create audit log
    API->>DB: Commit transaction
    API-->>FE: Return transaction details
    FE-->>U: Show updated balance

    Note over U,DB: Withdrawal
    U->>FE: Click "Withdraw"
    U->>FE: Enter amount
    FE->>API: POST /api/v1/accounts/{id}/transactions
    API->>API: Verify authorization
    API->>DB: Lock account (FOR UPDATE)
    API->>API: Check sufficient balance
    alt Sufficient Balance
        API->>DB: Create transaction
        API->>DB: Update balance
        API->>DB: Create audit log
        API-->>FE: Return success
    else Insufficient Balance
        API-->>FE: Return error (400)
    end
    FE-->>U: Show result
```

---

## Data Model

```mermaid
erDiagram
    CUSTOMER ||--o{ ACCOUNT : owns
    ACCOUNT ||--o{ TRANSACTION : has
    CUSTOMER ||--o{ AUDIT_LOG : generates
    ACCOUNT ||--o{ AUDIT_LOG : generates
    TRANSACTION ||--o{ AUDIT_LOG : generates

    CUSTOMER {
        string customer_id PK
        string email UK
        string password_hash
        string first_name
        string last_name
        string phone
        string address_line1
        string address_line2
        string city
        string state
        string postal_code
        string country
        date date_of_birth
        enum status
        datetime created_at
        datetime updated_at
    }

    ACCOUNT {
        string account_number PK
        string customer_id FK
        enum account_type
        decimal balance
        string nickname
        enum status
        datetime created_at
        datetime updated_at
    }

    TRANSACTION {
        string transaction_ref PK
        string account_number FK
        enum transaction_type
        decimal amount
        decimal balance_after
        string description
        datetime created_at
    }

    AUDIT_LOG {
        uuid id PK
        string correlation_id
        string customer_id
        enum action
        string resource_type
        string resource_id
        json details
        string ip_address
        string user_agent
        datetime created_at
    }
```

---

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/register` | Register new customer |
| POST | `/api/v1/auth/login` | Login and get tokens |
| POST | `/api/v1/auth/refresh` | Refresh access token |

### Customers

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/customers/me` | Get current customer profile |
| PUT | `/api/v1/customers/me` | Update customer profile |
| DELETE | `/api/v1/customers/me` | Deactivate customer account |

### Accounts

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/accounts` | List customer accounts |
| POST | `/api/v1/accounts` | Create new account |
| GET | `/api/v1/accounts/{number}` | Get account details |
| PUT | `/api/v1/accounts/{number}` | Update account settings |
| DELETE | `/api/v1/accounts/{number}` | Close account |

### Transactions

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/accounts/{number}/transactions` | List transactions |
| POST | `/api/v1/accounts/{number}/transactions` | Create transaction |
| GET | `/api/v1/accounts/{number}/transactions/{ref}` | Get transaction details |

### Health

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/health` | Liveness check |
| GET | `/api/v1/health/ready` | Readiness check |

---

## Security Features

```mermaid
graph TB
    subgraph "Authentication"
        JWT[JWT Tokens]
        BCR[Bcrypt Password Hashing]
        TOK[Token Expiration<br/>Access: 15min<br/>Refresh: 7 days]
    end

    subgraph "Authorization"
        RBAC[Resource-Based Access Control]
        OWN[Ownership Verification]
    end

    subgraph "Input Validation"
        PYD[Pydantic Schemas]
        E164[Phone E.164 Format]
        AGE[Age Verification 18+]
        DEC[Decimal Precision]
    end

    subgraph "Data Protection"
        ORM[SQLAlchemy ORM<br/>No Raw SQL]
        CORS[CORS Configuration]
        SENS[Sensitive Data Filtering]
    end

    subgraph "Observability"
        LOG[Structured JSON Logging]
        CID[Correlation ID Tracing]
        AUD[Audit Trail]
    end
```

---

## Request Flow with Middleware

```mermaid
sequenceDiagram
    participant C as Client
    participant CORS as CORS Middleware
    participant CID as Correlation ID Middleware
    participant AUTH as Auth Dependency
    participant EP as Endpoint
    participant SVC as Service
    participant DB as Database

    C->>CORS: HTTP Request
    CORS->>CORS: Validate Origin
    CORS->>CID: Pass Request
    CID->>CID: Extract/Generate Correlation ID
    CID->>EP: Pass Request with Context
    EP->>AUTH: Validate JWT Token
    AUTH->>AUTH: Decode & Verify Token
    AUTH->>EP: Return Customer ID
    EP->>SVC: Call Service Method
    SVC->>DB: Database Operations
    DB-->>SVC: Return Data
    SVC->>DB: Create Audit Log
    SVC-->>EP: Return Result
    EP-->>CID: Response
    CID->>CID: Add X-Correlation-ID Header
    CID-->>CORS: Response
    CORS-->>C: Final Response
```

---

## Project Structure

```
banking_microservice/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── deps.py           # Dependencies (auth, db)
│   │   │   └── v1/
│   │   │       ├── router.py     # API router
│   │   │       ├── auth.py       # Auth endpoints
│   │   │       ├── accounts.py   # Account endpoints
│   │   │       ├── customers.py  # Customer endpoints
│   │   │       ├── transactions.py
│   │   │       └── health.py
│   │   ├── core/
│   │   │   ├── exceptions.py     # Custom exceptions
│   │   │   ├── logging.py        # Structured logging
│   │   │   └── security.py       # JWT & password utils
│   │   ├── models/
│   │   │   ├── customer.py
│   │   │   ├── account.py
│   │   │   ├── transaction.py
│   │   │   └── audit_log.py
│   │   ├── schemas/
│   │   │   ├── customer.py       # Pydantic schemas
│   │   │   ├── account.py
│   │   │   ├── transaction.py
│   │   │   └── auth.py
│   │   ├── services/
│   │   │   ├── customer_service.py
│   │   │   ├── account_service.py
│   │   │   └── transaction_service.py
│   │   ├── config.py             # Settings
│   │   ├── database.py           # DB connection
│   │   └── main.py               # FastAPI app
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── api/                  # API clients
│   │   ├── components/           # UI components
│   │   ├── hooks/                # React hooks
│   │   ├── pages/                # Page components
│   │   ├── types/                # TypeScript types
│   │   └── App.tsx
│   ├── package.json
│   └── vite.config.ts
├── specs/                        # Feature specifications
├── start.sh                      # Start script
├── stop.sh                       # Stop script
├── docker-compose.yml            # Docker config
├── CONSTITUTION_COMPLIANCE.md    # Security compliance
└── README.md                     # This file
```

---

## Technology Stack

### Backend
- **Framework**: FastAPI (Python 3.11+)
- **ORM**: SQLAlchemy 2.0 (async)
- **Database**: SQLite (dev) / PostgreSQL 15+ (prod)
- **Authentication**: JWT (python-jose)
- **Password Hashing**: bcrypt via passlib
- **Validation**: Pydantic v2

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: TailwindCSS
- **State Management**: React Query
- **Routing**: React Router v6
- **HTTP Client**: Axios

---

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `sqlite+aiosqlite:///./banking.db` | Database connection string |
| `USE_SQLITE` | `true` | Use SQLite instead of PostgreSQL |
| `SECRET_KEY` | (required in prod) | JWT signing key |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `15` | Access token TTL |
| `REFRESH_TOKEN_EXPIRE_DAYS` | `7` | Refresh token TTL |
| `CORS_ORIGINS` | `localhost:3000,4002,5173` | Allowed CORS origins |
| `LOG_LEVEL` | `INFO` | Logging level |

---

## Development

### Prerequisites
- Python 3.11+
- Node.js 18+
- npm or yarn

### Running Locally

```bash
# Start both services
./start.sh

# Or run separately:

# Backend
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 4001

# Frontend
cd frontend
npm install
npm run dev -- --port 4002
```

### Running with Docker

```bash
# Start PostgreSQL only
docker compose up -d postgres

# Start all services
docker compose up -d
```

---

## Related Documentation

- [Constitution Compliance](CONSTITUTION_COMPLIANCE.md) - Security implementation details
- [API Documentation](http://localhost:4001/docs) - Interactive Swagger UI
- [Feature Specifications](specs/) - Detailed feature specs

---

## License

Private - All rights reserved.
