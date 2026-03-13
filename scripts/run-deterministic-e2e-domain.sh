#!/usr/bin/env sh
set -eu

DOMAIN="${1:-}"
WORKERS="${E2E_WORKERS:-1}"
SKIP_BUILD="${E2E_SKIP_BUILD:-0}"

if [ -z "$DOMAIN" ]; then
  echo "Usage: ./scripts/run-deterministic-e2e-domain.sh [auth-navigation|expense-review|recurring-cashflow]" >&2
  exit 1
fi

case "$DOMAIN" in
  auth-navigation)
    SPEC_ARGS='tests/auth/login.spec.ts tests/auth/route-protection.spec.ts tests/dashboard.spec.ts tests/navigation.spec.ts tests/responsive.spec.ts'
    ;;
  expense-review)
    SPEC_ARGS='tests/expense-crud.spec.ts tests/review.spec.ts'
    ;;
  recurring-cashflow)
    SPEC_ARGS='tests/recurring-expense.spec.ts tests/cashflow-income.spec.ts tests/cashflow-item.spec.ts'
    ;;
  *)
    echo "Unsupported domain: $DOMAIN" >&2
    echo "Usage: ./scripts/run-deterministic-e2e-domain.sh [auth-navigation|expense-review|recurring-cashflow]" >&2
    exit 1
    ;;
esac

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
E2E_DIR=$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)
cd "$E2E_DIR"

COMPOSE="docker compose -f docker-compose.yml"

cleanup() {
  $COMPOSE down -v >/dev/null 2>&1 || true
}
trap cleanup EXIT INT TERM

$COMPOSE down -v
if [ "$SKIP_BUILD" = "1" ]; then
  $COMPOSE up -d postgres backend frontend
else
  $COMPOSE up -d --build postgres backend frontend
fi
$COMPOSE exec -T backend sh -lc 'cd /var/www/html && php artisan migrate:fresh --seed --force'

$COMPOSE run --rm \
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
  -e E2E_WORKERS="$WORKERS" \
  playwright sh -lc "npm ci && npx playwright test --project=chromium --workers=$WORKERS $SPEC_ARGS"
