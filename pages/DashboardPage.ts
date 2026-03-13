import { Page, Locator } from '@playwright/test'
import { BasePage } from './BasePage'

/**
 * Dashboard page object
 */
export class DashboardPage extends BasePage {
  // Hero section
  readonly heroTitle: Locator
  readonly addExpenseButton: Locator
  readonly monthlyAmount: Locator
  readonly monthlyCount: Locator
  readonly impulseRatio: Locator
  readonly expenseFormModal: Locator

  // Stats cards
  readonly statsCards: Locator

  // Recent records
  readonly recentRecordsList: Locator
  readonly emptyState: Locator

  constructor(page: Page) {
    super(page)

    // Hero section
    this.heroTitle = page.getByTestId('dashboard-hero-title')
    this.addExpenseButton = page.getByTestId('dashboard-add-expense')
    this.monthlyAmount = page.locator('text=本月消費').locator('..')
    this.monthlyCount = page.locator('text=/共 \\d+ 筆/')
    this.impulseRatio = page.locator('text=衝動消費佔比').locator('..')
    this.expenseFormModal = page.getByTestId('expense-form-modal')

    // Stats cards
    this.statsCards = page.locator('.card')

    // Recent records
    this.recentRecordsList = page.locator('[data-testid="recent-records"]')
    this.emptyState = page.locator('text=還沒有消費記錄')
  }

  async goto() {
    await super.goto('/')
  }

  async openAddExpenseModal() {
    await this.addExpenseButton.waitFor({ state: 'visible' })
    await this.addExpenseButton.scrollIntoViewIfNeeded()
    await this.addExpenseButton.click()

    const openedOnFirstClick = await this.expenseFormModal
      .waitFor({ state: 'visible', timeout: 2000 })
      .then(() => true)
      .catch(() => false)

    if (!openedOnFirstClick) {
      await this.addExpenseButton.click()
    }

    await this.expenseFormModal.waitFor({ state: 'visible', timeout: 10000 })
    await this.page.getByRole('spinbutton', { name: '金額' }).waitFor({ state: 'visible' })
  }

  async getStatsCardByTitle(title: string): Promise<Locator> {
    return this.page.locator('.card').filter({ hasText: title })
  }
}
