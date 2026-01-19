#!/bin/bash

# Banking Microservices - Start Script
# Starts both backend (port 4001) and frontend (port 4002) servers

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/backend"
FRONTEND_DIR="$SCRIPT_DIR/frontend"
PID_DIR="$SCRIPT_DIR/.pids"

# Port configuration
BACKEND_PORT=4001
FRONTEND_PORT=4002

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Create PID directory if it doesn't exist
mkdir -p "$PID_DIR"

# Check if a port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0  # Port is in use
    else
        return 1  # Port is free
    fi
}

# Start Backend Server
start_backend() {
    log_info "Starting backend server on port $BACKEND_PORT..."

    if check_port $BACKEND_PORT; then
        log_warn "Port $BACKEND_PORT is already in use. Backend may already be running."
        return 1
    fi

    cd "$BACKEND_DIR"

    # Check if virtual environment exists, create if not
    if [ ! -d "venv" ] && [ ! -d ".venv" ]; then
        log_info "Creating Python virtual environment..."
        python3 -m venv venv
    fi

    # Activate virtual environment
    if [ -d "venv" ]; then
        source venv/bin/activate
    elif [ -d ".venv" ]; then
        source .venv/bin/activate
    fi

    # Install dependencies if needed
    if [ -f "requirements.txt" ]; then
        log_info "Installing backend dependencies..."
        pip install -q -r requirements.txt
    fi

    # Check if PostgreSQL is available, otherwise use SQLite
    if ! pg_isready -h localhost -p 5432 > /dev/null 2>&1; then
        log_warn "PostgreSQL not available, using SQLite for local development"
        export DATABASE_URL="sqlite+aiosqlite:///./banking.db"
        export USE_SQLITE=true
    else
        log_info "PostgreSQL is available"
        export USE_SQLITE=false
    fi

    # Start uvicorn in the background
    log_info "Starting FastAPI server..."
    nohup uvicorn app.main:app --host 0.0.0.0 --port $BACKEND_PORT --reload > "$SCRIPT_DIR/backend.log" 2>&1 &
    echo $! > "$PID_DIR/backend.pid"

    log_info "Backend server started (PID: $(cat "$PID_DIR/backend.pid"))"
    log_info "Backend logs: $SCRIPT_DIR/backend.log"
    log_info "Backend URL: http://localhost:$BACKEND_PORT"
    log_info "API Docs: http://localhost:$BACKEND_PORT/docs"
}

# Start Frontend Server
start_frontend() {
    log_info "Starting frontend server on port $FRONTEND_PORT..."

    if check_port $FRONTEND_PORT; then
        log_warn "Port $FRONTEND_PORT is already in use. Frontend may already be running."
        return 1
    fi

    cd "$FRONTEND_DIR"

    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        log_info "Installing frontend dependencies..."
        npm install
    fi

    # Update .env to use correct API URL
    echo "VITE_API_URL=http://localhost:$BACKEND_PORT/api/v1" > .env

    # Start Vite dev server in the background
    log_info "Starting Vite dev server..."
    nohup npm run dev -- --port $FRONTEND_PORT --host > "$SCRIPT_DIR/frontend.log" 2>&1 &
    echo $! > "$PID_DIR/frontend.pid"

    log_info "Frontend server started (PID: $(cat "$PID_DIR/frontend.pid"))"
    log_info "Frontend logs: $SCRIPT_DIR/frontend.log"
    log_info "Frontend URL: http://localhost:$FRONTEND_PORT"
}

# Main execution
main() {
    echo ""
    echo "=========================================="
    echo "  Banking Microservices - Starting..."
    echo "=========================================="
    echo ""

    start_backend
    echo ""

    # Give backend a moment to start
    sleep 2

    start_frontend
    echo ""

    echo "=========================================="
    echo "  All servers started successfully!"
    echo "=========================================="
    echo ""
    echo "Backend:  http://localhost:$BACKEND_PORT"
    echo "API Docs: http://localhost:$BACKEND_PORT/docs"
    echo "Frontend: http://localhost:$FRONTEND_PORT"
    echo ""
    echo "To stop servers, run: ./stop.sh"
    echo ""
}

main
