import { Page, Locator } from '@playwright/test'
import { BasePage } from './BasePage'

/**
 * Login Page Object
 */
export class LoginPage extends BasePage {
  // Form elements
  readonly emailInput: Locator
  readonly passwordInput: Locator
  readonly submitButton: Locator

  // Links
  readonly forgotPasswordLink: Locator
  readonly registerLink: Locator

  // Alerts
  readonly errorAlert: Locator

  constructor(page: Page) {
    super(page)
    // Use placeholder text to find inputs since labels may not have for attributes
    this.emailInput = page.getByPlaceholder('請輸入您的 Email')
    this.passwordInput = page.getByPlaceholder('請輸入您的密碼')
    this.submitButton = page.getByRole('button', { name: '登入' })
    this.forgotPasswordLink = page.getByRole('link', { name: '忘記密碼？' })
    this.registerLink = page.getByRole('link', { name: '立即註冊' })
    this.errorAlert = page.locator('[role="alert"]')
  }

  async goto() {
    await this.page.goto('/login')
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email)
    await this.passwordInput.fill(password)
    await this.submitButton.click()
  }

  async fillEmail(email: string) {
    await this.emailInput.fill(email)
  }

  async fillPassword(password: string) {
    await this.passwordInput.fill(password)
  }

  async submit() {
    await this.submitButton.click()
  }

  async goToRegister() {
    await this.registerLink.click()
  }

  async goToForgotPassword() {
    await this.forgotPasswordLink.click()
  }

  async getErrorMessage(): Promise<string> {
    const alert = this.errorAlert.first()
    if (await alert.isVisible()) {
      return await alert.textContent() || ''
    }
    return ''
  }

  async getFieldError(field: 'email' | 'password'): Promise<string> {
    // Find error message within the form - look for text-theme-error class
    const errorElements = this.page.locator('p.text-theme-error, p.text-caption.text-theme-error')
    const count = await errorElements.count()

    for (let i = 0; i < count; i++) {
      const text = await errorElements.nth(i).textContent()
      if (text) {
        if (field === 'email' && (text.includes('Email') || text.includes('email'))) {
          return text
        }
        if (field === 'password' && text.includes('密碼')) {
          return text
        }
      }
    }

    // Return first error if field-specific not found
    if (count > 0) {
      return await errorElements.first().textContent() || ''
    }
    return ''
  }
}
