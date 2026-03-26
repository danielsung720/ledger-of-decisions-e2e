#!/usr/bin/env sh
# Run Playwright tests in parallel shards and merge reports.
# Usage: ./scripts/run-shards.sh [TOTAL_SHARDS]
# Example: ./scripts/run-shards.sh 5
set -eu

TOTAL_SHARDS="${1:-5}"
SKIP_BUILD="${E2E_SKIP_BUILD:-0}"

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
E2E_DIR=$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)
cd "$E2E_DIR"

COMPOSE="docker compose -f docker-compose.yml"

cleanup() {
  $COMPOSE down -v >/dev/null 2>&1 || true
}
trap cleanup EXIT INT TERM

# Clean previous shard artifacts
rm -rf blob-reports
mkdir -p blob-reports

echo "==> Starting infrastructure (shards: $TOTAL_SHARDS)..."
$COMPOSE down -v
if [ "$SKIP_BUILD" = "1" ]; then
  $COMPOSE up -d postgres backend frontend
else
  $COMPOSE up -d --build postgres backend frontend
fi
$COMPOSE exec -T backend sh -lc 'cd /var/www/html && php artisan migrate:fresh --seed --force'
echo "==> Infrastructure ready."

# Run all shards in parallel
echo "==> Launching $TOTAL_SHARDS shards in parallel..."
PIDS=""
i=1
while [ "$i" -le "$TOTAL_SHARDS" ]; do
  echo "  -> shard $i/$TOTAL_SHARDS"
  $COMPOSE run --rm \
    -e CI=true \
    -e SHARD_REPORT=true \
    -e E2E_TEST_EMAIL="${E2E_TEST_EMAIL:-e2e_core@example.com}" \
    -e E2E_TEST_PASSWORD="${E2E_TEST_PASSWORD:-password}" \
    -e E2E_AUTH_EMAIL="${E2E_AUTH_EMAIL:-auth_e2e@example.com}" \
    -e E2E_AUTH_PASSWORD="${E2E_AUTH_PASSWORD:-password}" \
    -e E2E_EXPENSE_CRUD_EMAIL="${E2E_EXPENSE_CRUD_EMAIL:-expense_crud@example.com}" \
    -e E2E_EXPENSE_CRUD_PASSWORD="${E2E_EXPENSE_CRUD_PASSWORD:-password}" \
    -e E2E_BATCH_DELETE_EMAIL="${E2E_BATCH_DELETE_EMAIL:-batch_delete@example.com}" \
    -e E2E_BATCH_DELETE_PASSWORD="${E2E_BATCH_DELETE_PASSWORD:-password}" \
    -e E2E_RECURRING_EMAIL="${E2E_RECURRING_EMAIL:-recurring_e2e@example.com}" \
    -e E2E_RECURRING_PASSWORD="${E2E_RECURRING_PASSWORD:-password}" \
    -e E2E_CASHFLOW_EMAIL="${E2E_CASHFLOW_EMAIL:-cashflow_income@example.com}" \
    -e E2E_CASHFLOW_PASSWORD="${E2E_CASHFLOW_PASSWORD:-password}" \
    -e E2E_CASHFLOW_INCOME_EMAIL="${E2E_CASHFLOW_INCOME_EMAIL:-cashflow_income@example.com}" \
    -e E2E_CASHFLOW_INCOME_PASSWORD="${E2E_CASHFLOW_INCOME_PASSWORD:-password}" \
    -e E2E_CASHFLOW_ITEM_EMAIL="${E2E_CASHFLOW_ITEM_EMAIL:-cashflow_item@example.com}" \
    -e E2E_CASHFLOW_ITEM_PASSWORD="${E2E_CASHFLOW_ITEM_PASSWORD:-password}" \
    playwright sh -lc "npm ci && npx playwright test --shard=$i/$TOTAL_SHARDS" &
  PIDS="$PIDS $!"
  i=$((i + 1))
done

# Wait for all shards, collect exit codes
EXIT_CODE=0
for pid in $PIDS; do
  wait "$pid" || EXIT_CODE=1
done

echo "==> All shards done (exit_code=$EXIT_CODE). Merging reports..."

# Merge blob reports into a single HTML report
# HTML reporter writes to playwright-report/ by default
$COMPOSE run --rm \
  -e CI=true \
  playwright sh -lc "npm ci && npx playwright merge-reports --reporter html blob-reports/"

echo "==> Report merged -> playwright-report/index.html"
exit "$EXIT_CODE"
