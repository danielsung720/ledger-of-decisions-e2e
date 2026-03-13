import { Page, Locator } from '@playwright/test'
import { BasePage } from './BasePage'

/**
 * Register Page Object
 */
export class RegisterPage extends BasePage {
  // Form elements
  readonly nameInput: Locator
  readonly emailInput: Locator
  readonly passwordInput: Locator
  readonly confirmPasswordInput: Locator
  readonly submitButton: Locator

  // Links
  readonly loginLink: Locator

  // Alerts
  readonly errorAlert: Locator

  constructor(page: Page) {
    super(page)
    // Use placeholder text to find inputs
    this.nameInput = page.getByPlaceholder('請輸入您的名稱')
    this.emailInput = page.getByPlaceholder('請輸入您的 Email')
    this.passwordInput = page.getByPlaceholder('請輸入密碼')
    this.confirmPasswordInput = page.getByPlaceholder('請再次輸入密碼')
    this.submitButton = page.getByRole('button', { name: '建立帳號' })
    this.loginLink = page.getByRole('link', { name: '立即登入' })
    this.errorAlert = page.locator('[role="alert"]')
  }

  async goto() {
    await this.page.goto('/register')
  }

  async register(data: {
    name: string
    email: string
    password: string
    confirmPassword: string
  }) {
    await this.nameInput.fill(data.name)
    await this.emailInput.fill(data.email)
    await this.passwordInput.fill(data.password)
    await this.confirmPasswordInput.fill(data.confirmPassword)
    await this.submitButton.click()
  }

  async fillName(name: string) {
    await this.nameInput.fill(name)
  }

  async fillEmail(email: string) {
    await this.emailInput.fill(email)
  }

  async fillPassword(password: string) {
    await this.passwordInput.fill(password)
  }

  async fillConfirmPassword(password: string) {
    await this.confirmPasswordInput.fill(password)
  }

  async submit() {
    await this.submitButton.click()
  }

  async goToLogin() {
    await this.loginLink.click()
  }

  async getErrorMessage(): Promise<string> {
    const alert = this.errorAlert.first()
    if (await alert.isVisible()) {
      return await alert.textContent() || ''
    }
    return ''
  }

  async getFieldError(field: 'name' | 'email' | 'password' | 'confirmPassword'): Promise<string> {
    const errorElements = this.page.locator('p.text-theme-error, p.text-caption.text-theme-error')
    const count = await errorElements.count()

    const keywords: Record<string, string[]> = {
      name: ['名稱', '使用者'],
      email: ['Email', 'email'],
      password: ['密碼'],
      confirmPassword: ['密碼不一致', '確認'],
    }

    for (let i = 0; i < count; i++) {
      const text = await errorElements.nth(i).textContent() || ''
      const fieldKeywords = keywords[field]

      // Special case for confirmPassword - must contain '不一致'
      if (field === 'confirmPassword' && text.includes('不一致')) {
        return text
      }

      // For other fields, check keywords
      if (field !== 'confirmPassword') {
        for (const keyword of fieldKeywords) {
          if (text.includes(keyword)) {
            return text
          }
        }
      }
    }

    // Return first error if no specific match
    if (count > 0) {
      return await errorElements.first().textContent() || ''
    }
    return ''
  }
}
