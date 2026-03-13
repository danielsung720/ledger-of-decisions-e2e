import { test, expect } from '../../fixtures/test-fixtures'
import { loginByUi } from '../../helpers/login-by-ui'

const emptyStorageState = { cookies: [], origins: [] }
test.use({ storageState: emptyStorageState })

const TEST_EMAIL = process.env.E2E_AUTH_EMAIL || 'auth_e2e@example.com'
const TEST_PASSWORD = process.env.E2E_AUTH_PASSWORD || 'password'

test.describe('Route Protection', () => {
  test.describe('Protected Routes (require authentication)', () => {
    const protectedRoutes = [
      { path: '/', name: 'Home' },
      { path: '/records', name: 'Records' },
      { path: '/recurring', name: 'Recurring' },
      { path: '/cashflow', name: 'Cashflow' },
      { path: '/review', name: 'Review' },
    ]

    for (const route of protectedRoutes) {
      test(`redirects ${route.name} page to login when not authenticated`, async ({ page }) => {
        // Ensure no auth token
        await page.goto('/login')
        await page.evaluate(() => {
          localStorage.removeItem('auth_token')
        })

        // Try to access protected route
        await page.goto(route.path)

        // Should redirect to login
        await page.waitForURL('/login', { timeout: 5000 })
        await expect(page).toHaveURL('/login')
      })
    }
  })

  test.describe('Public Routes', () => {
    test('allows access to login page without authentication', async ({ page }) => {
      // Must visit a page first to access localStorage for that origin
      await page.goto('/login')
      await page.evaluate(() => {
        localStorage.removeItem('auth_token')
      })
      await page.reload()
      await page.waitForLoadState('networkidle')

      // Should stay on login page
      await expect(page).toHaveURL('/login')
      await expect(page.getByRole('heading', { name: 'Ledger of Decisions' })).toBeVisible()
    })

    test('allows access to register page without authentication', async ({ page }) => {
      // Must visit a page first to access localStorage for that origin
      await page.goto('/login')
      await page.evaluate(() => {
        localStorage.removeItem('auth_token')
      })

      await page.goto('/register')
      await page.waitForLoadState('networkidle')

      // Should stay on register page
      await expect(page).toHaveURL('/register')
      await expect(page.getByRole('heading', { name: '建立帳號' })).toBeVisible()
    })

    test('allows access to forgot-password page without authentication', async ({ page }) => {
      // Must visit a page first to access localStorage for that origin
      await page.goto('/login')
      await page.evaluate(() => {
        localStorage.removeItem('auth_token')
      })

      await page.goto('/forgot-password')
      await page.waitForLoadState('networkidle')

      // Should stay on forgot-password page
      await expect(page).toHaveURL('/forgot-password')
      await expect(page.getByRole('heading', { name: '忘記密碼？' })).toBeVisible()
    })
  })

  test.describe('Authenticated User Routes', () => {
    test('redirects authenticated user away from login page', async ({ page }) => {
      await loginByUi(page, {
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      })

      await page.goto('/login')
      await page.waitForURL('/', { timeout: 5000 })
      await expect(page).toHaveURL('/')
    })

    test('redirects authenticated user from verify-email page to home', async ({ page }) => {
      await loginByUi(page, {
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      })

      await page.goto('/verify-email')
      await expect(page).toHaveURL('/')
    })
  })

})
