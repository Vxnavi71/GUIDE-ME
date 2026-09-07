#!/usr/bin/env bash
# =====================================================================
# GUIDE ME - FINAL | Environment Setup Script (Git Bash Compatible)
# =====================================================================
set -e

echo "=== GUIDE ME: Initializing Enterprise Environment ==="

# Check Python installation
if ! command -v python &> /dev/null; then
    echo "ERROR: python could not be found in PATH. Please install Python 3.10+."
    exit 1
fi
echo "✓ Python detected: $(python --version)"

# Check Node installation
if ! command -v node &> /dev/null; then
    echo "ERROR: node could not be found in PATH. Please install Node.js 18+."
    exit 1
fi
echo "✓ Node.js detected: $(node --version)"

# 1. Install root Python dependencies (NO virtual environment as mandated)
echo ""
echo "=== Installing Python dependencies (no virtual environment) ==="
python -m pip install -r requirements.txt

# 2. Install frontend dependencies
echo ""
echo "=== Installing Frontend dependencies ==="
cd frontend
npm install
cd ..

# 3. Seed initial database records
echo ""
echo "=== Initializing & Seeding Database ==="
cd backend
export PYTHONPATH="."
python -m app.seed
cd ..

echo ""
echo "====================================================================="
echo "  GUIDE ME - FINAL has been successfully set up and seeded!"
echo "  Start backend:   ./scripts/start_backend.sh"
echo "  Start frontend:  ./scripts/start_frontend.sh"
echo "  Start all:       ./scripts/start_all.sh"
echo "====================================================================="
