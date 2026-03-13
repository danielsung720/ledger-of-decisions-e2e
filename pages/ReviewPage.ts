import { Page, Locator } from '@playwright/test'
import { BasePage } from './BasePage'

/**
 * Review (insights) page object
 */
export class ReviewPage extends BasePage {
  // Page elements
  readonly pageTitle: Locator

  // Date range selector
  readonly dateRangeSelector: Locator
  readonly todayButton: Locator
  readonly thisWeekButton: Locator
  readonly thisMonthButton: Locator
  readonly customButton: Locator
  readonly startDateInput: Locator
  readonly endDateInput: Locator

  // Overview cards
  readonly totalAmountCard: Locator
  readonly impulseRatioCard: Locator
  readonly trendCard: Locator

  // Charts
  readonly intentChart: Locator
  readonly confidenceChart: Locator

  // Insights
  readonly insightsList: Locator

  constructor(page: Page) {
    super(page)

    // Page elements
    this.pageTitle = page.getByTestId('review-page-title')

    // Date range selector
    this.dateRangeSelector = page.locator('[data-testid="date-range-selector"]')
    this.todayButton = page.getByTestId('review-preset-today')
    this.thisWeekButton = page.getByTestId('review-preset-this_week')
    this.thisMonthButton = page.getByTestId('review-preset-this_month')
    this.customButton = page.getByTestId('review-preset-custom')
    this.startDateInput = page.locator('input[type="date"]').first()
    this.endDateInput = page.locator('input[type="date"]').last()

    // Overview cards
    this.totalAmountCard = page.locator('.card').filter({ hasText: '總消費' }).first()
    this.impulseRatioCard = page.locator('.card').filter({ hasText: '衝動消費佔比' }).first()
    this.trendCard = page.locator('.card').filter({ hasText: '衝動消費趨勢' }).first()

    // Charts
    this.intentChart = page.locator('[data-testid="intent-chart"]')
    this.confidenceChart = page.locator('[data-testid="confidence-chart"]')

    // Insights
    this.insightsList = page.locator('[data-testid="insights-list"]')
  }

  async goto() {
    await super.goto('/review')
  }

  async selectDateRange(range: 'today' | 'this_week' | 'this_month' | 'custom') {
    const buttonMap = {
      today: this.todayButton,
      this_week: this.thisWeekButton,
      this_month: this.thisMonthButton,
      custom: this.customButton,
    }
    await buttonMap[range].click()
  }

  async setCustomDateRange(startDate: string, endDate: string) {
    await this.selectDateRange('custom')
    await this.startDateInput.fill(startDate)
    await this.endDateInput.fill(endDate)
  }

  async getTotalAmount(): Promise<string> {
    return await this.totalAmountCard.locator('.font-number').textContent() || ''
  }

  async getImpulseRatio(): Promise<string> {
    return await this.impulseRatioCard.locator('.font-number').textContent() || ''
  }
}
