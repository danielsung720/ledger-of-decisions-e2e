import { Page, Locator } from '@playwright/test'

/**
 * Base page object with common functionality
 */
export class BasePage {
  readonly page: Page

  constructor(page: Page) {
    this.page = page
  }

  // Common navigation
  async goto(path: string = '/') {
    await this.page.goto(path)
  }

  // Wait for page to be ready
  async waitForPageReady() {
    await this.page.waitForLoadState('networkidle')
  }

  // Common toast assertions
  get successToast(): Locator {
    return this.page.locator('.bg-success-50')
  }

  get errorToast(): Locator {
    return this.page.locator('.bg-alert-50')
  }

  get warningToast(): Locator {
    return this.page.locator('.bg-warning-50')
  }

  // Close toast
  async closeToast() {
    const closeButton = this.page.locator('[class*="toast"] button')
    if (await closeButton.isVisible()) {
      await closeButton.click()
    }
  }

  // Common modal interactions
  get modal(): Locator {
    return this.page.getByRole('dialog')
  }

  async closeModal() {
    await this.page.locator('[role="dialog"] button.btn-icon').first().click()
  }

  // Confirm dialog
  async confirmDialog() {
    await this.page.getByRole('button', { name: '確認' }).click()
  }

  async cancelDialog() {
    await this.page.getByRole('button', { name: '取消' }).click()
  }

  // Wait for API response
  async waitForApi(urlPattern: string | RegExp) {
    return this.page.waitForResponse((response) => {
      if (typeof urlPattern === 'string') {
        return response.url().includes(urlPattern)
      }
      return urlPattern.test(response.url())
    })
  }
}
