#!/usr/bin/env bash
# =====================================================================
# GUIDE ME - FINAL | Test Runner (Backend & Frontend)
# =====================================================================
set -e

# Change to project root if executed from within scripts/
if [ -d "scripts" ]; then
    PROJECT_ROOT="$(pwd)"
else
    PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
fi

echo "=== 1. Running Backend Pytest Test Suite ==="
cd "$PROJECT_ROOT/backend"
export PYTHONPATH="."
python -m pytest tests/test_backend.py -v

echo ""
echo "=== 2. Running Frontend Type-Check & Production Build ==="
cd "$PROJECT_ROOT/frontend"
npm run build

echo ""
echo "====================================================================="
echo "  All automated verification checks PASSED successfully!"
echo "====================================================================="
