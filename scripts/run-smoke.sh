#!/usr/bin/env sh
set -eu

SMOKE_GREP='displays login form|shows error for invalid credentials|navigates to register page when clicking register link|redirects Home page to login when not authenticated|allows access to login page without authentication|redirects authenticated user away from login page|displays hero section with correct content|opens expense form modal when clicking add button|creates a new expense from dashboard|validates required fields|edits an existing expense|deletes an expense with confirmation|submits recurring create request with normalized optional fields|requests active filter with is_active query parameter|creates income and renders it in income table|requests projection with selected month range when switching month selector|creates cashflow item and renders it in expense table|Review Page.*displays page title|requests summary API with selected preset|navigates to expense list|dashboard displays correctly on mobile'
SMOKE_WORKERS="${E2E_SMOKE_WORKERS:-1}"

npx playwright test \
  tests/auth/login.spec.ts \
  tests/auth/route-protection.spec.ts \
  tests/dashboard.spec.ts \
  tests/expense-crud.spec.ts \
  tests/recurring-expense.spec.ts \
  tests/cashflow-income.spec.ts \
  tests/cashflow-item.spec.ts \
  tests/review.spec.ts \
  tests/navigation.spec.ts \
  tests/responsive.spec.ts \
  --project=chromium \
  --workers="$SMOKE_WORKERS" \
  --grep "$SMOKE_GREP"
