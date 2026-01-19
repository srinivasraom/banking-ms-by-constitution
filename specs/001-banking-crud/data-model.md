# Data Model: Banking Microservices CRUD Operations

**Feature**: 001-banking-crud
**Date**: 2026-01-16
**Status**: Complete

## Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           ENTITY RELATIONSHIPS                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│    ┌──────────────┐         ┌──────────────┐         ┌──────────────┐       │
│    │   CUSTOMER   │ 1     * │   ACCOUNT    │ 1     * │ TRANSACTION  │       │
│    │──────────────│─────────│──────────────│─────────│──────────────│       │
│    │ id (PK)      │         │ id (PK)      │         │ id (PK)      │       │
│    │ customer_id  │         │ account_no   │         │ reference    │       │
│    │ email        │         │ customer_id  │         │ account_id   │       │
│    │ first_name   │         │ type         │         │ type         │       │
│    │ last_name    │         │ balance      │         │ amount       │       │
│    │ phone        │         │ status       │         │ balance_after│       │
│    │ address      │         │ nickname     │         │ description  │       │
│    │ date_of_birth│         │ created_at   │         │ created_at   │       │
│    │ status       │         │ updated_at   │         │              │       │
│    │ created_at   │         │              │         │              │       │
│    │ updated_at   │         │              │         │              │       │
│    └──────────────┘         └──────────────┘         └──────────────┘       │
│                                                                              │
│    Legend: PK = Primary Key, FK implied by _id suffix                       │
│            1 = One, * = Many                                                 │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Entities

### Customer

Represents a bank customer with personal information and authentication credentials.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK, auto-generated | Internal identifier |
| customer_id | String(12) | Unique, indexed | Public customer ID (e.g., "CUST00000001") |
| email | String(255) | Unique, indexed, not null | Customer email address |
| password_hash | String(255) | Not null | Bcrypt hashed password |
| first_name | String(100) | Not null | Customer first name |
| last_name | String(100) | Not null | Customer last name |
| phone | String(20) | Not null | Phone in E.164 format |
| address_line1 | String(255) | Not null | Street address |
| address_line2 | String(255) | Nullable | Apartment, suite, etc. |
| city | String(100) | Not null | City |
| state | String(100) | Not null | State/Province |
| postal_code | String(20) | Not null | ZIP/Postal code |
| country | String(2) | Not null, default "US" | ISO 3166-1 alpha-2 |
| date_of_birth | Date | Not null | Must be 18+ years ago |
| status | Enum | Not null, default "active" | active, inactive |
| created_at | DateTime | Not null, auto | Creation timestamp (UTC) |
| updated_at | DateTime | Not null, auto | Last update timestamp (UTC) |

**Validation Rules**:
- Email must be valid RFC 5322 format and unique
- Phone must be valid E.164 format (e.g., +1234567890)
- Date of birth must indicate customer is at least 18 years old
- Status transitions: active → inactive (only when no active accounts)

**Indexes**:
- `idx_customer_email` on `email` (unique)
- `idx_customer_customer_id` on `customer_id` (unique)
- `idx_customer_status` on `status`

---

### Account

Represents a bank account owned by a customer.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK, auto-generated | Internal identifier |
| account_number | String(16) | Unique, indexed, not null | Public account number |
| customer_id | UUID | FK → Customer.id, indexed, not null | Owner reference |
| account_type | Enum | Not null | checking, savings |
| balance | Decimal(15,2) | Not null, default 0.00 | Current balance |
| status | Enum | Not null, default "active" | active, closed |
| nickname | String(50) | Nullable | Customer-defined name |
| notify_on_transaction | Boolean | Not null, default true | Email notifications |
| created_at | DateTime | Not null, auto | Creation timestamp (UTC) |
| updated_at | DateTime | Not null, auto | Last update timestamp (UTC) |

**Validation Rules**:
- Account number generated as 16-digit number (bank prefix + random)
- Balance must be non-negative
- Balance must be zero to close account
- Cannot reopen a closed account

**State Transitions**:
```
active ──[close (balance=0)]──► closed
```

**Indexes**:
- `idx_account_number` on `account_number` (unique)
- `idx_account_customer_id` on `customer_id`
- `idx_account_status` on `status`

---

### Transaction

Represents a financial transaction (deposit or withdrawal) on an account.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK, auto-generated | Internal identifier |
| reference | String(20) | Unique, indexed, not null | Public transaction reference |
| account_id | UUID | FK → Account.id, indexed, not null | Account reference |
| transaction_type | Enum | Not null | deposit, withdrawal |
| amount | Decimal(15,2) | Not null, positive | Transaction amount |
| balance_after | Decimal(15,2) | Not null | Balance after transaction |
| description | String(255) | Nullable | Optional description |
| created_at | DateTime | Not null, auto | Transaction timestamp (UTC) |

**Validation Rules**:
- Amount must be positive (> 0)
- Amount must have at most 2 decimal places
- For withdrawals: amount ≤ account.balance
- Reference generated as "TXN" + timestamp + random

**Business Rules**:
- Transactions are immutable (no updates or deletes)
- Creating a transaction updates Account.balance atomically
- balance_after = previous_balance ± amount

**Indexes**:
- `idx_transaction_reference` on `reference` (unique)
- `idx_transaction_account_id` on `account_id`
- `idx_transaction_created_at` on `created_at`
- `idx_transaction_account_created` on `(account_id, created_at)` for efficient range queries

---

## Audit Log (Cross-Cutting)

All data modifications are logged for compliance.

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| correlation_id | String(36) | Request correlation ID |
| customer_id | UUID | Acting customer (nullable for system) |
| action | Enum | create, update, delete |
| resource_type | String | customer, account, transaction |
| resource_id | UUID | ID of affected resource |
| old_value | JSON | Previous state (nullable for create) |
| new_value | JSON | New state (nullable for delete) |
| ip_address | String | Client IP address |
| user_agent | String | Client user agent |
| created_at | DateTime | Audit timestamp (UTC) |

**Retention**: 7 years per banking regulations

---

## Database Schema (PostgreSQL)

```sql
-- Enums
CREATE TYPE customer_status AS ENUM ('active', 'inactive');
CREATE TYPE account_type AS ENUM ('checking', 'savings');
CREATE TYPE account_status AS ENUM ('active', 'closed');
CREATE TYPE transaction_type AS ENUM ('deposit', 'withdrawal');
CREATE TYPE audit_action AS ENUM ('create', 'update', 'delete');

-- Customers
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id VARCHAR(12) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    address_line1 VARCHAR(255) NOT NULL,
    address_line2 VARCHAR(255),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    country VARCHAR(2) NOT NULL DEFAULT 'US',
    date_of_birth DATE NOT NULL,
    status customer_status NOT NULL DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Accounts
CREATE TABLE accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_number VARCHAR(16) UNIQUE NOT NULL,
    customer_id UUID NOT NULL REFERENCES customers(id),
    account_type account_type NOT NULL,
    balance DECIMAL(15,2) NOT NULL DEFAULT 0.00 CHECK (balance >= 0),
    status account_status NOT NULL DEFAULT 'active',
    nickname VARCHAR(50),
    notify_on_transaction BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Transactions
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reference VARCHAR(20) UNIQUE NOT NULL,
    account_id UUID NOT NULL REFERENCES accounts(id),
    transaction_type transaction_type NOT NULL,
    amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
    balance_after DECIMAL(15,2) NOT NULL,
    description VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Audit Log
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    correlation_id VARCHAR(36) NOT NULL,
    customer_id UUID,
    action audit_action NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id UUID NOT NULL,
    old_value JSONB,
    new_value JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_customer_status ON customers(status);
CREATE INDEX idx_account_customer_id ON accounts(customer_id);
CREATE INDEX idx_account_status ON accounts(status);
CREATE INDEX idx_transaction_account_id ON transactions(account_id);
CREATE INDEX idx_transaction_created_at ON transactions(created_at);
CREATE INDEX idx_transaction_account_created ON transactions(account_id, created_at);
CREATE INDEX idx_audit_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_customer ON audit_logs(customer_id);
CREATE INDEX idx_audit_created ON audit_logs(created_at);
```

---

## Pydantic Schemas

### Customer Schemas

```python
# Request: Create Customer
class CustomerCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    first_name: str = Field(min_length=1, max_length=100)
    last_name: str = Field(min_length=1, max_length=100)
    phone: str  # E.164 format validated
    address_line1: str = Field(min_length=1, max_length=255)
    address_line2: str | None = Field(max_length=255, default=None)
    city: str = Field(min_length=1, max_length=100)
    state: str = Field(min_length=1, max_length=100)
    postal_code: str = Field(min_length=1, max_length=20)
    country: str = Field(default="US", pattern="^[A-Z]{2}$")
    date_of_birth: date  # Must be 18+ years ago

# Response: Customer
class CustomerResponse(BaseModel):
    customer_id: str
    email: str
    first_name: str
    last_name: str
    phone: str
    address_line1: str
    address_line2: str | None
    city: str
    state: str
    postal_code: str
    country: str
    date_of_birth: date
    status: CustomerStatus
    created_at: datetime
```

### Account Schemas

```python
# Request: Create Account
class AccountCreate(BaseModel):
    account_type: AccountType  # checking, savings
    initial_deposit: Decimal = Field(ge=0, decimal_places=2, default=Decimal("0.00"))
    nickname: str | None = Field(max_length=50, default=None)

# Request: Update Account
class AccountUpdate(BaseModel):
    nickname: str | None = Field(max_length=50)
    notify_on_transaction: bool | None = None

# Response: Account
class AccountResponse(BaseModel):
    account_number: str
    account_type: AccountType
    balance: Decimal
    status: AccountStatus
    nickname: str | None
    notify_on_transaction: bool
    created_at: datetime
```

### Transaction Schemas

```python
# Request: Create Transaction
class TransactionCreate(BaseModel):
    transaction_type: TransactionType  # deposit, withdrawal
    amount: Decimal = Field(gt=0, decimal_places=2)
    description: str | None = Field(max_length=255, default=None)

# Response: Transaction
class TransactionResponse(BaseModel):
    reference: str
    transaction_type: TransactionType
    amount: Decimal
    balance_after: Decimal
    description: str | None
    created_at: datetime

# Response: Transaction List
class TransactionListResponse(BaseModel):
    transactions: list[TransactionResponse]
    total: int
    next_cursor: str | None
```
