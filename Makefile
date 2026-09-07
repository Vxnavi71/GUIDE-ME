.PHONY: setup start test seed lint clean

setup:
	@bash scripts/setup.sh

start:
	@bash scripts/start_all.sh

start-backend:
	@bash scripts/start_backend.sh

start-frontend:
	@bash scripts/start_frontend.sh

test:
	@bash scripts/test.sh

seed:
	@bash scripts/seed.sh

clean:
	@find . -type d -name "__pycache__" -exec rm -rf {} +
	@find . -type d -name ".pytest_cache" -exec rm -rf {} +
	@rm -rf backend/guideme_local.db
	@echo "Cleaned temporary development caches."
