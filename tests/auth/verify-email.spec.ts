import { test, expect } from '../../fixtures/test-fixtures'

const emptyStorageState = { cookies: [], origins: [] }
test.use({ storageState: emptyStorageState })

test.describe('Verify Email Flow', () => {
  test.describe('Page Access', () => {
    test('redirects to login when accessing without pending email', async ({ page }) => {
      // Must visit a page first to access localStorage for that origin
      await page.goto('/login')
      await page.evaluate(() => {
        localStorage.removeItem('pending_verification_email')
      })

      await page.goto('/verify-email')

      // Should redirect to login
      await page.waitForURL('/login', { timeout: 5000 })
      await expect(page).toHaveURL('/login')
    })

    test('stays on verify-email page when pending email exists in localStorage', async ({ page }) => {
      await page.goto('/login')
      await page.evaluate(() => {
        localStorage.setItem('pending_verification_email', 'test@example.com')
      })

      await page.goto('/verify-email')

      await expect(page).toHaveURL('/verify-email')
      await expect(page.getByRole('heading', { name: '驗證您的 Email' })).toBeVisible()
      await expect(page.getByText('t***@example.com')).toBeVisible()
    })

    test('submits verify-email payload with pending email and otp code', async ({ page }) => {
      await page.goto('/login')
      await page.evaluate(() => {
        localStorage.setItem('pending_verification_email', 'test@example.com')
      })

      const verifyPayloadPromise = page.waitForRequest((request) => {
        return request.method() === 'POST' && request.url().includes('/api/verify-email')
      })

      await page.route('**/api/verify-email', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              token: 'verified-token',
              user: {
                id: 1,
                name: 'Test User',
                email: 'test@example.com',
              },
            },
            message: 'Email verified',
          }),
        })
      })

      await page.goto('/verify-email')
      const otpInputs = page.locator('input[type="text"][maxlength="1"]')
      await otpInputs.nth(0).fill('1')
      await otpInputs.nth(1).fill('2')
      await otpInputs.nth(2).fill('3')
      await otpInputs.nth(3).fill('4')
      await otpInputs.nth(4).fill('5')
      await otpInputs.nth(5).fill('6')

      const request = await verifyPayloadPromise
      const payload = request.postDataJSON() as { email: string; code: string }
      expect(payload.email).toBe('test@example.com')
      expect(payload.code).toBe('123456')

      await page.waitForURL('/', { timeout: 10000 })
      await expect(page).toHaveURL('/')
      const pendingEmail = await page.evaluate(() => localStorage.getItem('pending_verification_email'))
      const token = await page.evaluate(() => localStorage.getItem('auth_token'))
      expect(pendingEmail).toBe(null)
      expect(token).toBeTruthy()
      await page.unroute('**/api/verify-email')
    })

    test('keeps user on page and clears otp input when verify-email fails', async ({ page }) => {
      await page.goto('/login')
      await page.evaluate(() => {
        localStorage.setItem('pending_verification_email', 'test@example.com')
      })

      await page.route('**/api/verify-email', async (route) => {
        await route.fulfill({
          status: 422,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'Invalid verification code',
          }),
        })
      })

      await page.goto('/verify-email')
      const otpInputs = page.locator('input[type="text"][maxlength="1"]')
      await otpInputs.nth(0).fill('1')
      await otpInputs.nth(1).fill('2')
      await otpInputs.nth(2).fill('3')
      await otpInputs.nth(3).fill('4')
      await otpInputs.nth(4).fill('5')
      await otpInputs.nth(5).fill('6')

      await expect(page).toHaveURL('/verify-email')
      await expect(page.getByText('Invalid verification code')).toBeVisible()
      await expect(otpInputs.nth(0)).toHaveValue('')
      await page.unroute('**/api/verify-email')
    })
  })
})
