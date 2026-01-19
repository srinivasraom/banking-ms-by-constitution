#!/bin/bash

# Banking Microservices - Stop Script
# Stops both backend and frontend servers

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
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

# Stop a process by PID file
stop_by_pid_file() {
    local pid_file=$1
    local name=$2

    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if kill -0 "$pid" 2>/dev/null; then
            log_info "Stopping $name (PID: $pid)..."
            kill "$pid" 2>/dev/null
            sleep 1
            # Force kill if still running
            if kill -0 "$pid" 2>/dev/null; then
                log_warn "$name still running, force killing..."
                kill -9 "$pid" 2>/dev/null
            fi
            log_info "$name stopped."
        else
            log_warn "$name PID file exists but process is not running."
        fi
        rm -f "$pid_file"
    else
        log_warn "No PID file found for $name."
    fi
}

# Stop processes on a specific port
stop_by_port() {
    local port=$1
    local name=$2

    local pids=$(lsof -t -i:$port 2>/dev/null)
    if [ -n "$pids" ]; then
        log_info "Stopping $name processes on port $port..."
        for pid in $pids; do
            kill "$pid" 2>/dev/null
        done
        sleep 1
        # Force kill any remaining
        pids=$(lsof -t -i:$port 2>/dev/null)
        if [ -n "$pids" ]; then
            log_warn "Force killing remaining $name processes..."
            for pid in $pids; do
                kill -9 "$pid" 2>/dev/null
            done
        fi
        log_info "$name on port $port stopped."
    fi
}

# Stop Backend Server
stop_backend() {
    log_info "Stopping backend server..."
    stop_by_pid_file "$PID_DIR/backend.pid" "Backend"
    stop_by_port $BACKEND_PORT "Backend"
}

# Stop Frontend Server
stop_frontend() {
    log_info "Stopping frontend server..."
    stop_by_pid_file "$PID_DIR/frontend.pid" "Frontend"
    stop_by_port $FRONTEND_PORT "Frontend"
}

# Clean up log files (optional)
cleanup_logs() {
    if [ "$1" == "--clean" ]; then
        log_info "Cleaning up log files..."
        rm -f "$SCRIPT_DIR/backend.log"
        rm -f "$SCRIPT_DIR/frontend.log"
        log_info "Log files removed."
    fi
}

# Main execution
main() {
    echo ""
    echo "=========================================="
    echo "  Banking Microservices - Stopping..."
    echo "=========================================="
    echo ""

    stop_backend
    echo ""

    stop_frontend
    echo ""

    cleanup_logs "$1"

    echo "=========================================="
    echo "  All servers stopped."
    echo "=========================================="
    echo ""
    echo "To start servers again, run: ./start.sh"
    echo ""
}

main "$@"
