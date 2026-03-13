import { Page, Locator } from '@playwright/test'
import { BasePage } from './BasePage'

/**
 * Reset Password Page Object
 */
export class ResetPasswordPage extends BasePage {
  // Step 1: Enter code
  readonly enterCodeTitle: Locator
  readonly otpInputs: Locator

  // Step 2: Set new password
  readonly setPasswordTitle: Locator
  readonly newPasswordInput: Locator
  readonly confirmPasswordInput: Locator
  readonly submitButton: Locator

  // Navigation
  readonly backButton: Locator

  // Alerts
  readonly errorAlert: Locator

  constructor(page: Page) {
    super(page)
    this.enterCodeTitle = page.getByRole('heading', { name: '輸入驗證碼' })
    this.otpInputs = page.locator('input[type="text"][maxlength="1"]')

    this.setPasswordTitle = page.getByRole('heading', { name: '設定新密碼' })
    this.newPasswordInput = page.getByPlaceholder('請輸入新密碼')
    this.confirmPasswordInput = page.getByPlaceholder('請再次輸入新密碼')
    this.submitButton = page.getByRole('button', { name: '重設密碼' })

    this.backButton = page.getByRole('button', { name: '← 返回上一步' })
    this.errorAlert = page.locator('.bg-alert-50')
  }

  async goto() {
    await this.page.goto('/reset-password')
  }

  async enterOtp(code: string) {
    const digits = code.split('')
    for (let i = 0; i < digits.length && i < 6; i++) {
      await this.otpInputs.nth(i).focus()
      await this.otpInputs.nth(i).fill(digits[i])
    }
  }

  async setNewPassword(password: string, confirmPassword: string) {
    await this.newPasswordInput.fill(password)
    await this.confirmPasswordInput.fill(confirmPassword)
    await this.submitButton.click()
  }

  async fillNewPassword(password: string) {
    await this.newPasswordInput.fill(password)
  }

  async fillConfirmPassword(password: string) {
    await this.confirmPasswordInput.fill(password)
  }

  async submit() {
    await this.submitButton.click()
  }

  async goBack() {
    await this.backButton.click()
  }

  async getErrorMessage(): Promise<string> {
    const alert = this.errorAlert.first()
    if (await alert.isVisible()) {
      return await alert.textContent() || ''
    }
    return ''
  }

  async isOnCodeStep(): Promise<boolean> {
    return await this.enterCodeTitle.isVisible()
  }

  async isOnPasswordStep(): Promise<boolean> {
    return await this.setPasswordTitle.isVisible()
  }

  async getFieldError(field: 'password' | 'confirmPassword'): Promise<string> {
    const errorElements = this.page.locator('p.text-alert-500')
    const count = await errorElements.count()

    for (let i = 0; i < count; i++) {
      const text = await errorElements.nth(i).textContent() || ''
      if (field === 'confirmPassword' && text.includes('不一致')) {
        return text
      }
      if (field === 'password' && text.includes('密碼') && !text.includes('不一致')) {
        return text
      }
    }

    if (count > 0) {
      return await errorElements.first().textContent() || ''
    }
    return ''
  }
}
