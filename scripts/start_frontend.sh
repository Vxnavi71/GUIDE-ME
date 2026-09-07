#!/usr/bin/env bash
# =====================================================================
# GUIDE ME - FINAL | Start Frontend Server (Vite / React)
# =====================================================================
set -e

# Change to project frontend directory
if [ -d "frontend" ]; then
    cd frontend
elif [ -f "package.json" ]; then
    : # already in frontend
else
    cd "$(dirname "$0")/../frontend"
fi

echo "=== Starting GUIDE ME React Frontend on http://127.0.0.1:5173 ==="
npm run dev -- --host 127.0.0.1 --port 5173
