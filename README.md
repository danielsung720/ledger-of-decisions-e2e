# Ledger of Decisions - E2E Tests

End-to-end tests for the Ledger of Decisions application using Playwright.

## Prerequisites

- Node.js 18+
- Docker & Docker Compose
- Access to ledger-of-decisions-api and ledger-of-decisions-web repositories

## Project Structure

```
ledger-of-decisions-e2e/
├── tests/                    # Test files
│   ├── dashboard.spec.ts     # Dashboard page tests
│   ├── expense-crud.spec.ts  # Expense CRUD operations
│   ├── review.spec.ts        # Review page tests
│   ├── navigation.spec.ts    # Navigation tests
│   └── responsive.spec.ts    # Responsive design tests
├── pages/                    # Page Object Models
│   ├── BasePage.ts           # Base page with common methods
│   ├── DashboardPage.ts      # Dashboard page object
│   ├── ExpenseFormModal.ts   # Expense form modal object
│   ├── ExpenseListPage.ts    # Expense list page object
│   └── ReviewPage.ts         # Review page object
├── fixtures/                 # Test fixtures
│   └── test-fixtures.ts      # Custom Playwright fixtures
├── helpers/                  # Helper utilities
│   └── api.ts                # API helper for test data
├── docker-compose.yml        # Docker Compose configuration
├── playwright.config.ts      # Playwright configuration
└── package.json
```

## Installation

```bash
# Install dependencies
npm install

# Install Playwright browsers
npx playwright install
```

## Running Tests

### Local Development

```bash
# Run all tests
npm test

# Run tests with UI mode (recommended for debugging)
npm run test:ui

# Run tests in headed mode (see browser)
npm run test:headed

# Run tests in debug mode
npm run test:debug

# Show test report
npm run test:report
```

### With Docker Compose

This runs the complete stack (frontend, backend, database) in Docker:

```bash
# Start all services and run tests
docker compose up --build

# Or run step by step:
# 1. Start services
npm run docker:up

# 2. Run tests in Docker
npm run test:docker

# 2.1 Run PR smoke suite in Docker (chromium)
npm run test:docker:smoke

# 2.2 Run deterministic smoke parallel sanity (workers=2 by default)
npm run test:docker:smoke:parallel

# 2.3 Run deterministic full chromium regression
npm run test:docker:deterministic:chromium

# 2.4 Run deterministic full chromium parallel (workers=2 by default)
npm run test:docker:deterministic:chromium:parallel

# 3. Stop services
npm run docker:down
```

### Ephemeral DB (Recommended for CI/Isolation)

Run E2E with a disposable PostgreSQL database (fresh schema + seed for each run):

```bash
npm run test:docker:fresh
```

This command will:
- `down -v` to clear previous state
- start `postgres/backend/frontend`
- run `php artisan migrate:fresh --seed --force` in backend
- execute Playwright tests
- `down -v` after completion

## Test Categories

| Category | Description | File |
|----------|-------------|------|
| Dashboard | Hero section, stats, recent records | `dashboard.spec.ts` |
| Expense CRUD | Create, read, update, delete expenses | `expense-crud.spec.ts` |
| Review | Date range selection, charts, insights | `review.spec.ts` |
| Navigation | Page navigation, header, links | `navigation.spec.ts` |
| Responsive | Mobile, tablet, desktop layouts | `responsive.spec.ts` |

## Page Object Model

We use the Page Object Model pattern for maintainable tests:

```typescript
import { test, expect } from '../fixtures/test-fixtures'

test('creates a new expense', async ({ dashboardPage, expenseFormModal }) => {
  await dashboardPage.goto()
  await dashboardPage.openAddExpenseModal()

  await expenseFormModal.fillForm({
    amount: '500',
    category: '飲食',
    intent: 'necessity',
  })

  await expenseFormModal.submit()
  await expect(dashboardPage.successToast).toBeVisible()
})
```

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `BASE_URL` | `http://localhost:3000` | Frontend URL |
| `API_URL` | `http://localhost:8080/api` | Backend API URL |
| `CI` | - | Set in CI environment |
| `E2E_WORKERS` | mode-dependent | Playwright worker count (`chromium`/`smoke` default 1, `*-parallel` default 2) |
| `E2E_SMOKE_WORKERS` | inherits `E2E_WORKERS` | Worker count override for smoke runner |
| `E2E_TEST_EMAIL` | `e2e_core@example.com` | Shared storageState account |
| `E2E_AUTH_EMAIL` | `auth_e2e@example.com` | Auth spec account |
| `E2E_EXPENSE_CRUD_EMAIL` | `expense_crud@example.com` | Expense CRUD account |
| `E2E_BATCH_DELETE_EMAIL` | `batch_delete@example.com` | Batch delete account |
| `E2E_RECURRING_EMAIL` | `recurring_e2e@example.com` | Recurring spec account |
| `E2E_CASHFLOW_INCOME_EMAIL` | `cashflow_income@example.com` | Cashflow income account |
| `E2E_CASHFLOW_ITEM_EMAIL` | `cashflow_item@example.com` | Cashflow item account |

### Playwright Config

Key settings in `playwright.config.ts`:

- **Browsers**: Chromium, Firefox, WebKit
- **Mobile**: Pixel 5, iPhone 12
- **Timeout**: 30 seconds per test
- **Retries**: 2 on CI, 0 locally
- **Artifacts**: Screenshots, videos, traces on failure

## CI/CD Integration

### GitHub Actions Workflows

- PR smoke: `.github/workflows/e2e-smoke-pr.yml`
- Nightly domain regression: `.github/workflows/e2e-domain-nightly.yml`
- Weekly full regression: `.github/workflows/e2e-full-weekly.yml`

All workflows use Docker Buildx layer cache via `docker/build-push-action@v6`
(`cache-from/cache-to: type=gha`) and then run deterministic scripts with
`E2E_SKIP_BUILD=1` to reduce repeated build cost.

## Writing New Tests

1. Create a new spec file in `tests/`
2. Use existing page objects or create new ones in `pages/`
3. Use custom fixtures from `fixtures/test-fixtures.ts`
4. Follow the naming convention: `feature-name.spec.ts`

## Debugging

```bash
# Run with Playwright Inspector
npm run test:debug

# Run with trace viewer
npx playwright show-trace test-results/trace.zip

# Run specific test
npx playwright test dashboard.spec.ts

# Run test with specific browser
npx playwright test --project=chromium
```

## Reports

After running tests, view the HTML report:

```bash
npm run test:report
```

Report includes:
- Test results summary
- Screenshots of failures
- Videos of failed tests
- Trace files for debugging
