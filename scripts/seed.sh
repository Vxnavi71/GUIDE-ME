#!/usr/bin/env bash
# =====================================================================
# GUIDE ME - FINAL | Database Seeder Script
# =====================================================================
set -e

# Change to project root if executed from within scripts/
if [ -d "scripts" ]; then
    PROJECT_ROOT="$(pwd)"
else
    PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
fi

echo "=== Seeding GUIDE ME Database with Demo Archetype and Clinical Baselines ==="
cd "$PROJECT_ROOT/backend"
export PYTHONPATH="."
python -m app.seed

echo ""
echo "Database seeding completed."
echo "Demo account available: demo@guideme.com / DemoUser123!"
