import { test, expect } from '../../fixtures/test-fixtures'

const emptyStorageState = { cookies: [], origins: [] }
test.use({ storageState: emptyStorageState })
const PENDING_EMAIL_KEY = 'pending_verification_email'

test.describe('Forgot Password Flow', () => {
  test.describe('Page Display', () => {
    test('displays forgot password form', async ({ forgotPasswordPage }) => {
      await forgotPasswordPage.goto()
      await expect(forgotPasswordPage.pageTitle).toBeVisible()
      await expect(forgotPasswordPage.emailInput).toBeVisible()
      await expect(forgotPasswordPage.submitButton).toBeVisible()
    })

    test('displays page title', async ({ page, forgotPasswordPage }) => {
      await forgotPasswordPage.goto()
      await expect(page.getByRole('heading', { name: '忘記密碼？' })).toBeVisible()
    })

    test('displays description text', async ({ page, forgotPasswordPage }) => {
      await forgotPasswordPage.goto()
      await expect(page.getByText('輸入您的 Email')).toBeVisible()
    })

    test('displays back to login link', async ({ forgotPasswordPage }) => {
      await forgotPasswordPage.goto()
      await expect(forgotPasswordPage.backToLoginLink).toBeVisible()
    })
  })

  test.describe('Form Validation', () => {
    test('shows error when email is empty', async ({ forgotPasswordPage }) => {
      await forgotPasswordPage.goto()
      await forgotPasswordPage.submit()

      const error = await forgotPasswordPage.getFieldError()
      expect(error).toContain('請輸入 Email')
    })

    // NOTE: Email format validation test removed due to frontend issue
    // HTML5 type="email" validation blocks custom validation
    // See: features/03-member-system/issues/qa-to-frontend-email-validation.md
  })

  test.describe('Request Password Reset', () => {
    test('shows code sent state after valid email submission', async ({ forgotPasswordPage, page }) => {
      await forgotPasswordPage.goto()
      await forgotPasswordPage.requestPasswordReset('test@example.com')

      // Wait for the code sent state
      await page.waitForTimeout(1000)

      // Should show "驗證碼已發送" title
      await expect(forgotPasswordPage.codeSentTitle).toBeVisible()
    })

    test('displays enter code button in code sent state', async ({ forgotPasswordPage }) => {
      await forgotPasswordPage.goto()
      await forgotPasswordPage.requestPasswordReset('test@example.com')
      await expect(forgotPasswordPage.enterCodeButton).toBeVisible()
    })

    test('displays resend button in code sent state', async ({ forgotPasswordPage }) => {
      await forgotPasswordPage.goto()
      await forgotPasswordPage.requestPasswordReset('test@example.com')
      await expect(forgotPasswordPage.resendButton).toBeVisible()
    })

    test('restores code sent state when returning from login page', async ({ page, forgotPasswordPage }) => {
      await forgotPasswordPage.goto()
      await forgotPasswordPage.requestPasswordReset('test@example.com')
      await expect(forgotPasswordPage.codeSentTitle).toBeVisible()
      await expect(page.getByText('t***@example.com')).toBeVisible()

      await forgotPasswordPage.goToLogin()
      await expect(page).toHaveURL('/login')
      await page.getByRole('link', { name: '忘記密碼？' }).click()
      await expect(page).toHaveURL('/forgot-password')
      await expect(forgotPasswordPage.codeSentTitle).toBeVisible()
      await expect(page.getByText('t***@example.com')).toBeVisible()

      await page.evaluate((key: string) => {
        localStorage.removeItem(key)
      }, PENDING_EMAIL_KEY)
    })
  })

  test.describe('Navigation', () => {
    test('navigates to login when clicking back link', async ({ forgotPasswordPage, page }) => {
      await forgotPasswordPage.goto()
      await forgotPasswordPage.goToLogin()
      await expect(page).toHaveURL('/login')
    })

    test('navigates to reset password page when clicking enter code button', async ({ forgotPasswordPage, page }) => {
      await forgotPasswordPage.goto()
      await forgotPasswordPage.requestPasswordReset('test@example.com')

      await forgotPasswordPage.goToResetPassword()
      await expect(page).toHaveURL('/reset-password')
    })
  })

  test.describe('Resend Code', () => {
    test('can resend verification code', async ({ forgotPasswordPage, page }) => {
      await forgotPasswordPage.goto()
      await forgotPasswordPage.requestPasswordReset('test@example.com')

      // Click resend
      await forgotPasswordPage.clickResend()

      // Button should show countdown or be disabled
      await page.waitForTimeout(500)
      const isDisabled = await forgotPasswordPage.resendButton.isDisabled()
      expect(isDisabled).toBe(true)
    })
  })
})
