import { Page, Locator } from '@playwright/test'
import { BasePage } from './BasePage'

/**
 * Forgot Password Page Object
 */
export class ForgotPasswordPage extends BasePage {
  // Initial state elements
  readonly pageTitle: Locator
  readonly emailInput: Locator
  readonly submitButton: Locator

  // Code sent state elements
  readonly codeSentTitle: Locator
  readonly maskedEmail: Locator
  readonly enterCodeButton: Locator
  readonly resendButton: Locator

  // Links
  readonly backToLoginLink: Locator

  // Alerts
  readonly errorAlert: Locator

  constructor(page: Page) {
    super(page)
    this.pageTitle = page.getByRole('heading', { name: '忘記密碼？' })
    this.emailInput = page.getByPlaceholder('請輸入您的 Email')
    this.submitButton = page.getByRole('button', { name: '發送驗證碼' })

    this.codeSentTitle = page.getByRole('heading', { name: '驗證碼已發送' })
    this.maskedEmail = page.locator('p').filter({ hasText: /@/ }).first()
    this.enterCodeButton = page.getByRole('button', { name: '輸入驗證碼' })
    this.resendButton = page.getByRole('button', { name: /重新發送/ })

    this.backToLoginLink = page.getByText('← 返回登入')
    this.errorAlert = page.locator('[role="alert"]')
  }

  async goto() {
    await this.page.goto('/forgot-password')
  }

  async requestPasswordReset(email: string) {
    await this.emailInput.fill(email)
    await this.submitButton.click()
  }

  async fillEmail(email: string) {
    await this.emailInput.fill(email)
  }

  async submit() {
    await this.submitButton.click()
  }

  async goToResetPassword() {
    await this.enterCodeButton.click()
  }

  async clickResend() {
    await this.resendButton.click()
  }

  async goToLogin() {
    await this.backToLoginLink.click()
  }

  async getErrorMessage(): Promise<string> {
    const alert = this.errorAlert.first()
    if (await alert.isVisible()) {
      return await alert.textContent() || ''
    }
    return ''
  }

  async isCodeSent(): Promise<boolean> {
    return await this.codeSentTitle.isVisible()
  }

  async getFieldError(): Promise<string> {
    const errorElement = this.page.locator('p.text-theme-error, p.text-caption.text-theme-error').first()
    if (await errorElement.isVisible()) {
      return await errorElement.textContent() || ''
    }
    return ''
  }
}
