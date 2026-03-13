import { test, expect } from '../../fixtures/test-fixtures'

const emptyStorageState = { cookies: [], origins: [] }
test.use({ storageState: emptyStorageState })

test.describe('Register Flow', () => {
  test.beforeEach(async ({ registerPage }) => {
    await registerPage.goto()
  })

  test.describe('Page Display', () => {
    test('displays registration form', async ({ registerPage }) => {
      await expect(registerPage.nameInput).toBeVisible()
      await expect(registerPage.emailInput).toBeVisible()
      await expect(registerPage.passwordInput).toBeVisible()
      await expect(registerPage.confirmPasswordInput).toBeVisible()
      await expect(registerPage.submitButton).toBeVisible()
    })

    test('displays login link', async ({ registerPage }) => {
      await expect(registerPage.loginLink).toBeVisible()
      await expect(registerPage.loginLink).toHaveText('立即登入')
    })

    test('displays page title', async ({ page }) => {
      await expect(page.getByRole('heading', { name: '建立帳號' })).toBeVisible()
    })
  })

  test.describe('Form Validation', () => {
    test('shows error when name is empty', async ({ registerPage }) => {
      await registerPage.fillEmail('test@example.com')
      await registerPage.fillPassword('password123')
      await registerPage.fillConfirmPassword('password123')
      await registerPage.submit()

      const error = await registerPage.getFieldError('name')
      expect(error).toContain('請輸入使用者名稱')
    })

    test('shows error when name is too short', async ({ registerPage }) => {
      await registerPage.fillName('A')
      await registerPage.fillEmail('test@example.com')
      await registerPage.fillPassword('password123')
      await registerPage.fillConfirmPassword('password123')
      await registerPage.submit()

      const error = await registerPage.getFieldError('name')
      expect(error).toContain('2-50')
    })

    test('shows error when email is empty', async ({ registerPage }) => {
      await registerPage.fillName('Test User')
      await registerPage.fillPassword('password123')
      await registerPage.fillConfirmPassword('password123')
      await registerPage.submit()

      const error = await registerPage.getFieldError('email')
      expect(error).toContain('請輸入 Email')
    })

    // NOTE: Email format validation test removed due to frontend issue
    // HTML5 type="email" validation blocks custom validation
    // See: features/03-member-system/issues/qa-to-frontend-email-validation.md

    test('shows error when password is empty', async ({ registerPage }) => {
      await registerPage.fillName('Test User')
      await registerPage.fillEmail('test@example.com')
      await registerPage.fillConfirmPassword('password123')
      await registerPage.submit()

      const error = await registerPage.getFieldError('password')
      expect(error).toContain('請輸入密碼')
    })

    test('shows error when password is too short', async ({ registerPage }) => {
      await registerPage.fillName('Test User')
      await registerPage.fillEmail('test@example.com')
      await registerPage.fillPassword('short')
      await registerPage.fillConfirmPassword('short')
      await registerPage.submit()

      const error = await registerPage.getFieldError('password')
      expect(error).toContain('8 個字元')
    })

    test('shows error when password confirmation is empty', async ({ registerPage }) => {
      await registerPage.fillName('Test User')
      await registerPage.fillEmail('test@example.com')
      await registerPage.fillPassword('password123')
      await registerPage.submit()

      const error = await registerPage.getFieldError('confirmPassword')
      expect(error).toContain('請確認密碼')
    })

    test('shows error when passwords do not match', async ({ registerPage }) => {
      await registerPage.fillName('Test User')
      await registerPage.fillEmail('test@example.com')
      await registerPage.fillPassword('password123')
      await registerPage.fillConfirmPassword('differentpassword')
      await registerPage.submit()

      const error = await registerPage.getFieldError('confirmPassword')
      expect(error).toContain('密碼不一致')
    })
  })

  test.describe('Navigation', () => {
    test('navigates to login page when clicking login link', async ({ registerPage, page }) => {
      await registerPage.goToLogin()
      await expect(page).toHaveURL('/login')
    })
  })

  test.describe('Successful Registration', () => {
    test('redirects to verify-email page on successful registration', async ({ registerPage, page, apiHelper }) => {
      const testEmail = apiHelper.generateTestEmail()

      await registerPage.register({
        name: 'Test User',
        email: testEmail,
        password: 'password123',
        confirmPassword: 'password123',
      })

      // Wait for navigation to verify-email page
      await page.waitForURL('/verify-email', { timeout: 10000 })
      await expect(page).toHaveURL('/verify-email')
    })

    test('shows loading state during registration', async ({ registerPage, apiHelper }) => {
      const testEmail = apiHelper.generateTestEmail()

      await registerPage.fillName('Test User')
      await registerPage.fillEmail(testEmail)
      await registerPage.fillPassword('password123')
      await registerPage.fillConfirmPassword('password123')

      // Click and immediately check for loading state
      const submitPromise = registerPage.submit()

      // Button should show loading state
      await expect(registerPage.submitButton).toBeDisabled()

      await submitPromise
    })
  })

  test.describe('Error Handling', () => {
    test('shows error when email is already registered', async ({ registerPage, page, apiHelper }) => {
      // Use a unique email for this test run
      const existingEmail = `duplicate_${Date.now()}@example.com`

      // First registration
      await registerPage.register({
        name: 'First User',
        email: existingEmail,
        password: 'password123',
        confirmPassword: 'password123',
      })

      // Wait for first registration to complete (redirect to verify-email)
      await page.waitForURL('/verify-email', { timeout: 10000 })

      // Navigate back to register
      await registerPage.goto()

      // Try to register again with same email
      await registerPage.register({
        name: 'Second User',
        email: existingEmail,
        password: 'password123',
        confirmPassword: 'password123',
      })

      // Wait for error to appear
      await page.waitForTimeout(2000)

      // Should show error about email already in use
      const errorAlert = page.locator('[role="alert"]').first()
      await expect(errorAlert).toBeVisible()
      const errorMessage = await errorAlert.textContent()
      expect(errorMessage).toMatch(/已被使用|已被註冊|already|exist/i)
    })
  })
})
