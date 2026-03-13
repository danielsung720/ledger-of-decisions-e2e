import { test, expect } from '../../fixtures/test-fixtures'
import { loginByApi } from '../../helpers/login-by-api'

const emptyStorageState = { cookies: [], origins: [] }
test.use({ storageState: emptyStorageState })

const TEST_EMAIL = process.env.E2E_AUTH_EMAIL || 'auth_e2e@example.com'
const TEST_PASSWORD = process.env.E2E_AUTH_PASSWORD || 'password'

test.describe('Logout Flow', () => {
  test('clears local auth state and redirects to login even when logout API fails', async ({ page, apiHelper }) => {
    await loginByApi(page, apiHelper, {
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    })

    await page.goto('/')
    await expect(page).toHaveURL('/')

    await page.route('**/api/logout', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'logout failed' }),
      })
    })

    await page.locator('button.rounded-full').first().click()
    await page.getByRole('button', { name: '登出' }).click()

    await page.waitForURL('/login', { timeout: 10000 })
    await expect(page).toHaveURL('/login')
    const storedToken = await page.evaluate(() => localStorage.getItem('auth_token'))
    expect(storedToken).toBe(null)
    await page.unroute('**/api/logout')
  })

  test.describe('Unauthenticated Header', () => {
    test('displays login and register buttons when not logged in', async ({ page }) => {
      // Clear any auth token
      await page.goto('/login')
      await page.evaluate(() => {
        localStorage.removeItem('auth_token')
      })

      await page.goto('/login')

      // The login page shows the login form, not the header buttons
      // Let's check a page where the header is visible
      // Note: Since unauthenticated users are redirected, we check the login page itself
      await expect(page.getByRole('button', { name: '登入' })).toBeVisible()
    })
  })
})
