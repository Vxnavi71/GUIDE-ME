#!/usr/bin/env bash
# =====================================================================
# GUIDE ME - FINAL | Concurrent Server Runner (Git Bash Compatible)
# =====================================================================
set -e

# Change to project root if executed from within scripts/
if [ -d "scripts" ]; then
    PROJECT_ROOT="$(pwd)"
else
    PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
fi

echo "====================================================================="
echo "  GUIDE ME - FINAL | Starting Full-Stack Prototype"
echo "  Backend:  http://127.0.0.1:8000 (API & Swagger: /docs)"
echo "  Frontend: http://127.0.0.1:5173"
echo "  Press Ctrl+C to shut down all processes cleanly."
echo "====================================================================="

# Clean shutdown handler
cleanup() {
    echo ""
    echo "=== Shutting down GUIDE ME servers... ==="
    if [ -n "$BACKEND_PID" ]; then
        kill "$BACKEND_PID" 2>/dev/null || true
    fi
    if [ -n "$FRONTEND_PID" ]; then
        kill "$FRONTEND_PID" 2>/dev/null || true
    fi
    wait 2>/dev/null || true
    echo "All processes stopped cleanly."
    exit 0
}

trap cleanup SIGINT SIGTERM EXIT

# 1. Start Backend in background
cd "$PROJECT_ROOT/backend"
export PYTHONPATH="."
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 &
BACKEND_PID=$!
echo "✓ Backend initiated with PID: $BACKEND_PID"

# 2. Start Frontend in background
cd "$PROJECT_ROOT/frontend"
npm run dev -- --host 127.0.0.1 --port 5173 &
FRONTEND_PID=$!
echo "✓ Frontend initiated with PID: $FRONTEND_PID"

# Wait on background processes
wait
