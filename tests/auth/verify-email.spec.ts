import { test, expect } from '../../fixtures/test-fixtures'
import type { Page } from '@playwright/test'
import type { ApiHelper } from '../../helpers/api'

const emptyStorageState = { cookies: [], origins: [] }
test.use({ storageState: emptyStorageState })
const PENDING_EMAIL_KEY = 'pending_verification_email'

async function goToVerifyEmailByUnverifiedLogin(
  page: Page,
  apiHelper: ApiHelper
) {
  const email = `verify_${Date.now()}_${Math.random().toString(36).slice(2, 8)}@example.com`
  const password = 'password123'

  const registerResult = await apiHelper.register({
    name: 'Verify Email E2E',
    email,
    password,
    password_confirmation: password,
  })
  expect(registerResult.ok).toBe(true)

  await page.goto('/login')
  await page.getByPlaceholder('請輸入您的 Email').fill(email)
  await page.getByPlaceholder('請輸入您的密碼').fill(password)
  await page.getByRole('button', { name: '登入' }).click()
  await page.waitForURL('/verify-email', { timeout: 10000 })

  return email
}

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

    test('stays on verify-email page when pending email exists in auth flow', async ({ page, apiHelper }) => {
      const email = await goToVerifyEmailByUnverifiedLogin(page, apiHelper)
      const [local, domain] = email.split('@')
      await expect(page).toHaveURL('/verify-email')
      await expect(page.getByRole('heading', { name: '驗證您的 Email' })).toBeVisible()
      await expect(page.getByText(`${local[0]}***@${domain}`)).toBeVisible()
    })

    test('submits verify-email payload with pending email and otp code', async ({ page, apiHelper }) => {
      const email = await goToVerifyEmailByUnverifiedLogin(page, apiHelper)

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
              id: 1,
              name: 'Test User',
              email,
            },
            message: 'Email verified',
          }),
        })
      })

      const otpInputs = page.locator('input[type="text"][maxlength="1"]')
      await otpInputs.nth(0).fill('1')
      await otpInputs.nth(1).fill('2')
      await otpInputs.nth(2).fill('3')
      await otpInputs.nth(3).fill('4')
      await otpInputs.nth(4).fill('5')
      await otpInputs.nth(5).fill('6')

      const request = await verifyPayloadPromise
      const payload = request.postDataJSON() as { email: string; code: string }
      expect(payload.email).toBe(email)
      expect(payload.code).toBe('123456')

      await page.waitForURL('/', { timeout: 10000 })
      await expect(page).toHaveURL('/')
      const pendingEmail = await page.evaluate(
        (key: string) => localStorage.getItem(key),
        PENDING_EMAIL_KEY
      )
      expect(pendingEmail).toBe(null)
      await page.unroute('**/api/verify-email')
    })

    test('keeps user on page and clears otp input when verify-email fails', async ({ page, apiHelper }) => {
      await goToVerifyEmailByUnverifiedLogin(page, apiHelper)

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
