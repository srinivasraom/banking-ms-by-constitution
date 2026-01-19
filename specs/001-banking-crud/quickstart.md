# Quickstart Guide: Banking Microservices CRUD Operations

**Feature**: 001-banking-crud
**Date**: 2026-01-16

## Prerequisites

- Python 3.11+
- Node.js 18+ and npm 9+
- PostgreSQL 15+
- Docker and Docker Compose (recommended)

## Quick Start with Docker

The fastest way to run the complete stack:

```bash
# Clone and navigate to project
cd banking_microservice

# Start all services (PostgreSQL, Backend, Frontend)
docker-compose up -d

# View logs
docker-compose logs -f
```

Access:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **OpenAPI Spec**: http://localhost:8000/openapi.json

## Manual Setup

### 1. Database Setup

```bash
# Start PostgreSQL (using Docker)
docker run -d \
  --name banking-postgres \
  -e POSTGRES_USER=banking \
  -e POSTGRES_PASSWORD=banking_secret \
  -e POSTGRES_DB=banking \
  -p 5432:5432 \
  postgres:15

# Or configure your existing PostgreSQL instance
# Create database: CREATE DATABASE banking;
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Linux/Mac
# or: venv\Scripts\activate  # Windows

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your database credentials

# Run database migrations
alembic upgrade head

# Start the server
uvicorn app.main:app --reload --port 8000
```

**Environment Variables** (.env):
```bash
DATABASE_URL=postgresql://banking:banking_secret@localhost:5432/banking
SECRET_KEY=your-secret-key-change-in-production
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7
CORS_ORIGINS=http://localhost:3000
```

### 3. Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with API URL

# Start development server
npm run dev
```

**Environment Variables** (.env):
```bash
VITE_API_URL=http://localhost:8000/api/v1
```

## Verify Installation

### 1. Check Backend Health

```bash
curl http://localhost:8000/api/v1/health
# Expected: {"status":"healthy","version":"1.0.0",...}

curl http://localhost:8000/api/v1/health/ready
# Expected: {"status":"ready","database":"connected"}
```

### 2. Register a Test Customer

```bash
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "password": "SecurePassword123!",
    "first_name": "John",
    "last_name": "Doe",
    "phone": "+12025551234",
    "address_line1": "123 Main St",
    "city": "New York",
    "state": "NY",
    "postal_code": "10001",
    "date_of_birth": "1990-01-15"
  }'
```

### 3. Login and Get Token

```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "password": "SecurePassword123!"
  }'
# Save the access_token from response
```

### 4. Create an Account

```bash
export TOKEN="your-access-token-here"

curl -X POST http://localhost:8000/api/v1/accounts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "account_type": "checking",
    "initial_deposit": 1000.00,
    "nickname": "Primary Checking"
  }'
# Save the account_number from response
```

### 5. Create a Transaction

```bash
export ACCOUNT="1234567890123456"

curl -X POST "http://localhost:8000/api/v1/accounts/$ACCOUNT/transactions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "transaction_type": "deposit",
    "amount": 500.00,
    "description": "Initial deposit"
  }'
```

### 6. View Transaction History

```bash
curl "http://localhost:8000/api/v1/accounts/$ACCOUNT/transactions" \
  -H "Authorization: Bearer $TOKEN"
```

## Frontend Usage

1. Open http://localhost:3000 in your browser
2. Register a new account or login with existing credentials
3. Navigate to:
   - **Dashboard**: Overview of all accounts and recent transactions
   - **Accounts**: Create, view, and manage bank accounts
   - **Transactions**: Make deposits/withdrawals and view history
   - **Profile**: Update personal information

## API Documentation

Interactive API documentation is available at:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## Running Tests

### Backend Tests
```bash
cd backend

# Run all tests
pytest

# Run with coverage
pytest --cov=app --cov-report=html

# Run specific test types
pytest tests/unit/
pytest tests/integration/
pytest tests/contract/
```

### Frontend Tests
```bash
cd frontend

# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch
```

## Development Tips

### Database Reset
```bash
# Reset database (WARNING: deletes all data)
cd backend
alembic downgrade base
alembic upgrade head
```

### View Logs
```bash
# Backend logs (structured JSON)
docker-compose logs -f backend

# Filter by level
docker-compose logs backend 2>&1 | jq 'select(.level == "ERROR")'
```

### Generate TypeScript Types from OpenAPI
```bash
cd frontend
npm run generate:types
# This generates types from the backend OpenAPI spec
```

## Troubleshooting

### Port Already in Use
```bash
# Check what's using port 8000
lsof -i :8000
# Kill the process or change the port in .env
```

### Database Connection Failed
```bash
# Verify PostgreSQL is running
docker ps | grep postgres

# Check connection
psql -h localhost -U banking -d banking -c "SELECT 1"
```

### CORS Errors
Ensure `CORS_ORIGINS` in backend `.env` includes your frontend URL:
```bash
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
```

### Token Expired
Access tokens expire after 15 minutes. Use the refresh token endpoint or login again.

## Architecture Overview

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│  React Frontend │────▶│  FastAPI Backend│────▶│   PostgreSQL    │
│  (Port 3000)    │     │  (Port 8000)    │     │   (Port 5432)   │
│                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
         │                      │
         │                      │
         ▼                      ▼
   React Query           SQLAlchemy ORM
   (State Mgmt)          (Data Access)
```

## Next Steps

1. Review [spec.md](./spec.md) for feature requirements
2. Review [data-model.md](./data-model.md) for entity details
3. Review [contracts/openapi.yaml](./contracts/openapi.yaml) for API specification
4. Run `/speckit.tasks` to generate implementation tasks
