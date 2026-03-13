import { test, expect } from '../../fixtures/test-fixtures'

const emptyStorageState = { cookies: [], origins: [] }
test.use({ storageState: emptyStorageState })

test.describe('Reset Password Flow', () => {
  test.describe('Page Access', () => {
    test('redirects to forgot-password when accessing without pending email', async ({ page }) => {
      // Must visit a page first to access localStorage for that origin
      await page.goto('/login')
      await page.evaluate(() => {
        localStorage.removeItem('pending_verification_email')
      })

      await page.goto('/reset-password')

      // Should redirect to forgot-password
      await page.waitForURL('/forgot-password', { timeout: 5000 })
      await expect(page).toHaveURL('/forgot-password')
    })

    test('stays on reset-password page when pending email exists in localStorage', async ({ page }) => {
      await page.goto('/login')
      await page.evaluate(() => {
        localStorage.setItem('pending_verification_email', 'test@example.com')
      })

      await page.goto('/reset-password')

      await expect(page).toHaveURL('/reset-password')
      await expect(page.getByRole('heading', { name: '輸入驗證碼' })).toBeVisible()
    })

    test('submits reset-password payload with pending email, otp code and new password', async ({ page }) => {
      await page.goto('/login')
      await page.evaluate(() => {
        localStorage.setItem('pending_verification_email', 'test@example.com')
      })

      const resetPayloadPromise = page.waitForRequest((request) => {
        return request.method() === 'POST' && request.url().includes('/api/reset-password')
      })

      await page.route('**/api/reset-password', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message: 'Password reset',
          }),
        })
      })

      await page.goto('/reset-password')
      const otpInputs = page.locator('input[type="text"][maxlength="1"]')
      await otpInputs.nth(0).fill('1')
      await otpInputs.nth(1).fill('2')
      await otpInputs.nth(2).fill('3')
      await otpInputs.nth(3).fill('4')
      await otpInputs.nth(4).fill('5')
      await otpInputs.nth(5).fill('6')

      await page.getByPlaceholder('請輸入新密碼').fill('newpassword123')
      await page.getByPlaceholder('請再次輸入新密碼').fill('newpassword123')
      await page.getByRole('button', { name: '重設密碼' }).click()

      const request = await resetPayloadPromise
      const payload = request.postDataJSON() as {
        email: string
        code: string
        password: string
        password_confirmation: string
      }
      expect(payload.email).toBe('test@example.com')
      expect(payload.code).toBe('123456')
      expect(payload.password).toBe('newpassword123')
      expect(payload.password_confirmation).toBe('newpassword123')

      await page.waitForURL('/login', { timeout: 10000 })
      await expect(page).toHaveURL('/login')
      await page.unroute('**/api/reset-password')
    })
  })
})
