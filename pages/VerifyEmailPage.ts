import { Page, Locator } from '@playwright/test'
import { BasePage } from './BasePage'

/**
 * Verify Email Page Object
 */
export class VerifyEmailPage extends BasePage {
  // Header
  readonly pageTitle: Locator
  readonly maskedEmail: Locator

  // OTP Input
  readonly otpInputs: Locator
  readonly hint: Locator

  // Actions
  readonly resendButton: Locator
  readonly backToLoginLink: Locator

  // Alerts
  readonly errorAlert: Locator

  // Loading
  readonly spinner: Locator

  constructor(page: Page) {
    super(page)
    this.pageTitle = page.getByRole('heading', { name: '驗證您的 Email' })
    this.maskedEmail = page.locator('p.font-medium').first()
    // OTP inputs are text inputs with maxlength 1
    this.otpInputs = page.locator('input[type="text"][maxlength="1"]')
    this.hint = page.getByText('驗證碼 10 分鐘內有效')
    this.resendButton = page.getByRole('button', { name: /重新發送/ })
    this.backToLoginLink = page.getByText('← 返回登入')
    this.errorAlert = page.locator('.bg-alert-50')
    this.spinner = page.locator('[class*="spinner"]')
  }

  async goto() {
    await this.page.goto('/verify-email')
  }

  async getMaskedEmail(): Promise<string> {
    return await this.maskedEmail.textContent() || ''
  }

  async enterOtp(code: string) {
    const digits = code.split('')
    for (let i = 0; i < digits.length && i < 6; i++) {
      await this.otpInputs.nth(i).focus()
      await this.otpInputs.nth(i).fill(digits[i])
    }
  }

  async pasteOtp(code: string) {
    // Focus first input and paste
    await this.otpInputs.first().focus()
    await this.page.keyboard.insertText(code)
  }

  async clearOtp() {
    for (let i = 0; i < 6; i++) {
      await this.otpInputs.nth(i).clear()
    }
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

  async isResendButtonDisabled(): Promise<boolean> {
    return await this.resendButton.isDisabled()
  }

  async getResendButtonText(): Promise<string> {
    return await this.resendButton.textContent() || ''
  }

  async hasOtpError(): Promise<boolean> {
    // Check if OTP inputs have error state (shake animation or red border)
    const firstInput = this.otpInputs.first()
    const classes = await firstInput.getAttribute('class') || ''
    return classes.includes('border-alert') || classes.includes('shake')
  }
}
