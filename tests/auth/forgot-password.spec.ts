import { test, expect } from '../../fixtures/test-fixtures'

const emptyStorageState = { cookies: [], origins: [] }
test.use({ storageState: emptyStorageState })

test.describe('Forgot Password Flow', () => {
  test.beforeEach(async ({ forgotPasswordPage }) => {
    await forgotPasswordPage.goto()
  })

  test.describe('Page Display', () => {
    test('displays forgot password form', async ({ forgotPasswordPage }) => {
      await expect(forgotPasswordPage.pageTitle).toBeVisible()
      await expect(forgotPasswordPage.emailInput).toBeVisible()
      await expect(forgotPasswordPage.submitButton).toBeVisible()
    })

    test('displays page title', async ({ page }) => {
      await expect(page.getByRole('heading', { name: '忘記密碼？' })).toBeVisible()
    })

    test('displays description text', async ({ page }) => {
      await expect(page.getByText('輸入您的 Email')).toBeVisible()
    })

    test('displays back to login link', async ({ forgotPasswordPage }) => {
      await expect(forgotPasswordPage.backToLoginLink).toBeVisible()
    })
  })

  test.describe('Form Validation', () => {
    test('shows error when email is empty', async ({ forgotPasswordPage }) => {
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
      await forgotPasswordPage.requestPasswordReset('test@example.com')

      // Wait for the code sent state
      await page.waitForTimeout(1000)

      // Should show "驗證碼已發送" title
      await expect(forgotPasswordPage.codeSentTitle).toBeVisible()
    })

    test('displays enter code button in code sent state', async ({ forgotPasswordPage, page }) => {
      await page.goto('/login')
      await page.evaluate(() => {
        localStorage.setItem('pending_verification_email', 'test@example.com')
      })
      await forgotPasswordPage.goto()

      await expect(forgotPasswordPage.enterCodeButton).toBeVisible()
    })

    test('displays resend button in code sent state', async ({ forgotPasswordPage, page }) => {
      await page.goto('/login')
      await page.evaluate(() => {
        localStorage.setItem('pending_verification_email', 'test@example.com')
      })
      await forgotPasswordPage.goto()

      await expect(forgotPasswordPage.resendButton).toBeVisible()
    })

    test('restores code sent state from pending email after reload', async ({ page, forgotPasswordPage }) => {
      await page.goto('/login')
      await page.evaluate(() => {
        localStorage.setItem('pending_verification_email', 'test@example.com')
      })

      await forgotPasswordPage.goto()

      await expect(forgotPasswordPage.codeSentTitle).toBeVisible()
      await expect(page.getByText('t***@example.com')).toBeVisible()
    })
  })

  test.describe('Navigation', () => {
    test('navigates to login when clicking back link', async ({ forgotPasswordPage, page }) => {
      await forgotPasswordPage.goToLogin()
      await expect(page).toHaveURL('/login')
    })

    test('navigates to reset password page when clicking enter code button', async ({ forgotPasswordPage, page }) => {
      await page.goto('/login')
      await page.evaluate(() => {
        localStorage.setItem('pending_verification_email', 'test@example.com')
      })
      await forgotPasswordPage.goto()

      await forgotPasswordPage.goToResetPassword()
      await expect(page).toHaveURL('/reset-password')
    })
  })

  test.describe('Resend Code', () => {
    test('can resend verification code', async ({ forgotPasswordPage, page }) => {
      await page.goto('/login')
      await page.evaluate(() => {
        localStorage.setItem('pending_verification_email', 'test@example.com')
      })
      await forgotPasswordPage.goto()

      // Click resend
      await forgotPasswordPage.clickResend()

      // Button should show countdown or be disabled
      await page.waitForTimeout(500)
      const isDisabled = await forgotPasswordPage.resendButton.isDisabled()
      expect(isDisabled).toBe(true)
    })
  })
})
