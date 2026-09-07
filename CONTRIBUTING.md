# Contributing to GUIDE ME

Thank you for your interest in contributing to **GUIDE ME**.

## Code of Conduct
We adhere to an empathetic, inclusive, and science-grounded community culture.

## Development Workflow (Windows + Git Bash)

1. Clone or pull the repository.
2. Install dependencies directly into your host environment:
   ```bash
   pip install -r requirements.txt
   cd frontend && npm install && cd ..
   ```
   *(Note: As per architecture rules, do NOT create a Python virtual environment).*
3. Run migrations and database seeding:
   ```bash
   ./scripts/seed.sh
   ```
4. Start development servers:
   ```bash
   ./scripts/start_all.sh
   ```
5. Run tests before submitting PRs:
   ```bash
   ./scripts/test.sh
   ```

## Commit Guidelines
Use clear conventional commits (e.g. `feat:`, `fix:`, `docs:`, `test:`, `refactor:`).
