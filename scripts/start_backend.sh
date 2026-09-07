#!/usr/bin/env bash
# =====================================================================
# GUIDE ME - FINAL | Start Backend Server (FastAPI / Uvicorn)
# =====================================================================
set -e

# Change to project root if executed from within scripts/
if [ -d "backend" ]; then
    cd backend
elif [ -f "app/main.py" ]; then
    : # already in backend
else
    cd "$(dirname "$0")/../backend"
fi

export PYTHONPATH="."
echo "=== Starting GUIDE ME FastAPI Backend on http://127.0.0.1:8000 ==="
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
