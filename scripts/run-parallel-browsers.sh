#!/usr/bin/env sh
# Run all 5 browser projects in parallel, each with isolated test users.
# Usage: ./scripts/run-parallel-browsers.sh
#
# Each browser container uses its own set of test accounts
# (e.g. e2e_core_chromium@example.com) to avoid data contention.
set -eu

SKIP_BUILD="${E2E_SKIP_BUILD:-0}"

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
E2E_DIR=$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)
cd "$E2E_DIR"

COMPOSE="docker compose -f docker-compose.yml"

cleanup() {
  $COMPOSE down -v >/dev/null 2>&1 || true
}
trap cleanup EXIT INT TERM

# Clean per-browser auth state files
rm -f playwright/.auth/chromium.json \
      playwright/.auth/firefox.json \
      playwright/.auth/webkit.json \
      playwright/.auth/mobile_chrome.json \
      playwright/.auth/mobile_safari.json

echo "==> Starting infrastructure..."
$COMPOSE down -v
if [ "$SKIP_BUILD" = "1" ]; then
  $COMPOSE up -d postgres backend frontend
else
  $COMPOSE up -d --build postgres backend frontend
fi
$COMPOSE exec -T backend sh -lc 'cd /var/www/html && php artisan migrate:fresh --seed --force'
echo "==> Infrastructure ready."

# Install dependencies once (shared playwright_cache volume)
echo "==> Installing npm dependencies..."
$COMPOSE run --rm playwright sh -lc "npm ci"
echo "==> Dependencies ready. Launching 5 browsers in parallel..."

# Run one browser container — args: BROWSER PROJECT_NAME
run_browser() {
  B="$1"   # e.g. chromium
  P="$2"   # e.g. "Mobile Chrome"

  $COMPOSE run --rm \
    -e CI=true \
    -e E2E_BROWSER="$B" \
    -e E2E_TEST_EMAIL="e2e_core_${B}@example.com" \
    -e E2E_TEST_PASSWORD="password" \
    -e E2E_AUTH_EMAIL="auth_e2e_${B}@example.com" \
    -e E2E_AUTH_PASSWORD="password" \
    -e E2E_EXPENSE_CRUD_EMAIL="expense_crud_${B}@example.com" \
    -e E2E_EXPENSE_CRUD_PASSWORD="password" \
    -e E2E_BATCH_DELETE_EMAIL="batch_delete_${B}@example.com" \
    -e E2E_BATCH_DELETE_PASSWORD="password" \
    -e E2E_RECURRING_EMAIL="recurring_e2e_${B}@example.com" \
    -e E2E_RECURRING_PASSWORD="password" \
    -e E2E_CASHFLOW_EMAIL="cashflow_income_${B}@example.com" \
    -e E2E_CASHFLOW_PASSWORD="password" \
    -e E2E_CASHFLOW_INCOME_EMAIL="cashflow_income_${B}@example.com" \
    -e E2E_CASHFLOW_INCOME_PASSWORD="password" \
    -e E2E_CASHFLOW_ITEM_EMAIL="cashflow_item_${B}@example.com" \
    -e E2E_CASHFLOW_ITEM_PASSWORD="password" \
    playwright sh -lc "npx playwright test --project=\"$P\""
}

# Stagger browser starts by 60s to avoid all 5 browsers hammering the backend
# simultaneously during their later tests (batch-delete, cashflow, etc.).
# Total stagger: 4 × 60s = 4 min; with ~7 min per browser this gives ~11 min total.
run_browser chromium       chromium        &
sleep 60
run_browser firefox        firefox         &
sleep 60
run_browser webkit         webkit          &
sleep 60
run_browser mobile_chrome  "Mobile Chrome" &
sleep 60
run_browser mobile_safari  "Mobile Safari" &

# Wait for all browsers, collect exit codes
EXIT_CODE=0
for pid in $(jobs -p); do
  wait "$pid" || EXIT_CODE=1
done

if [ "$EXIT_CODE" -eq 0 ]; then
  echo "==> All browsers passed."
else
  echo "==> Some browsers failed (exit_code=$EXIT_CODE)."
fi

exit "$EXIT_CODE"
