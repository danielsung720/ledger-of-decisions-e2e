import { Page, Locator } from '@playwright/test'
import { BasePage } from './BasePage'

/**
 * Expense list page object
 */
export class ExpenseListPage extends BasePage {
  // Page elements
  readonly pageTitle: Locator
  readonly addButton: Locator

  // Filter bar
  readonly filterBar: Locator
  readonly categoryFilter: Locator
  readonly intentFilter: Locator
  readonly sortSelect: Locator

  // Expense list
  readonly expenseList: Locator
  readonly expenseRows: Locator
  readonly emptyState: Locator

  // Pagination
  readonly pagination: Locator
  readonly prevButton: Locator
  readonly nextButton: Locator

  // Batch selection
  readonly headerCheckbox: Locator
  readonly rowCheckboxes: Locator
  readonly batchActionBar: Locator
  readonly batchDeleteButton: Locator
  readonly selectedCountText: Locator

  // Batch delete confirm dialog
  readonly batchDeleteDialog: Locator
  readonly batchDeleteConfirmButton: Locator
  readonly batchDeleteCancelButton: Locator

  constructor(page: Page) {
    super(page)

    // Page elements
    this.pageTitle = page.getByRole('heading', { name: '消費記錄' })
    this.addButton = page.getByRole('button', { name: '新增消費' })

    // Filter bar
    this.filterBar = page.locator('[data-testid="filter-bar"]')
    this.categoryFilter = page.locator('[data-testid="category-filter"]')
    this.intentFilter = page.locator('[data-testid="intent-filter"]')
    this.sortSelect = page.locator('[data-testid="sort-select"]')

    // Expense list - use the row checkbox parent as expense row locator
    this.expenseList = page.locator('.space-y-3')
    this.expenseRows = page.locator('[data-testid="row-checkbox"]').locator('..')
    this.emptyState = page.locator('text=尚無消費記錄')

    // Pagination
    this.pagination = page.locator('[data-testid="pagination"]')
    this.prevButton = page.getByRole('button', { name: '上一頁' })
    this.nextButton = page.getByRole('button', { name: '下一頁' })

    // Batch selection
    this.headerCheckbox = page.locator('[data-testid="header-checkbox"]')
    this.rowCheckboxes = page.locator('[data-testid="row-checkbox"]')
    this.batchActionBar = page.locator('[data-testid="batch-action-bar"]')
    this.batchDeleteButton = page.locator('[data-testid="batch-delete-button"]')
    this.selectedCountText = page.locator('[data-testid="selected-count"]')

    // Batch delete confirm dialog - use text locators for more reliability with HeadlessUI
    this.batchDeleteDialog = page.getByRole('dialog')
    this.batchDeleteConfirmButton = page.getByRole('button', { name: '確認' })
    this.batchDeleteCancelButton = page.locator('[role="dialog"]').getByRole('button', { name: '取消' })
  }

  async goto() {
    await super.goto('/records')
  }

  async openAddExpenseModal() {
    await this.addButton.click()
    await this.modal.waitFor({ state: 'visible' })
  }

  async getExpenseRowByAmount(amount: string): Promise<Locator> {
    return this.page.locator('[data-testid="expense-row"]').filter({ hasText: amount })
  }

  async editExpense(amount: string) {
    const row = await this.getExpenseRowByAmount(amount)
    await row.locator('button[title="編輯"]').click()
    await this.modal.waitFor({ state: 'visible' })
  }

  async deleteExpense(amount: string) {
    const row = await this.getExpenseRowByAmount(amount)
    await row.locator('button[title="刪除"]').click()
  }

  async filterByCategory(category: string) {
    await this.categoryFilter.click()
    await this.page.getByRole('option', { name: category }).click()
  }

  async filterByIntent(intent: string) {
    await this.intentFilter.click()
    await this.page.getByRole('option', { name: intent }).click()
  }

  async goToPage(pageNumber: number) {
    await this.page.getByRole('button', { name: String(pageNumber) }).click()
  }

  async getExpenseCount(): Promise<number> {
    return await this.rowCheckboxes.count()
  }

  // Batch selection methods
  async selectRow(index: number) {
    await this.rowCheckboxes.nth(index).click()
  }

  async selectRowByAmount(amount: string) {
    const row = await this.getExpenseRowByAmount(amount)
    await row.locator('[data-testid="row-checkbox"]').click()
  }

  async selectAll() {
    await this.headerCheckbox.click()
  }

  async getSelectedCount(): Promise<number> {
    const text = await this.selectedCountText.textContent()
    const match = text?.match(/\d+/)
    return match ? parseInt(match[0], 10) : 0
  }

  async isRowSelected(index: number): Promise<boolean> {
    const row = this.expenseRows.nth(index)
    const hasSelectedClass = await row.evaluate((el) =>
      el.classList.contains('bg-primary-50') ||
      el.getAttribute('data-selected') === 'true'
    )
    return hasSelectedClass
  }

  async getRowCheckboxState(index: number): Promise<boolean> {
    const checkbox = this.rowCheckboxes.nth(index)
    const ariaChecked = await checkbox.getAttribute('aria-checked')
    return ariaChecked === 'true'
  }

  async getHeaderCheckboxState(): Promise<'checked' | 'unchecked' | 'indeterminate'> {
    const checkbox = this.headerCheckbox
    const ariaChecked = await checkbox.getAttribute('aria-checked')

    if (ariaChecked === 'mixed') return 'indeterminate'
    return ariaChecked === 'true' ? 'checked' : 'unchecked'
  }

  async isBatchActionBarVisible(): Promise<boolean> {
    return await this.batchActionBar.isVisible()
  }

  // Batch delete methods
  async clickBatchDelete() {
    await this.batchDeleteButton.click()
  }

  async confirmBatchDelete() {
    await this.batchDeleteConfirmButton.click()
  }

  async cancelBatchDelete() {
    await this.batchDeleteCancelButton.click()
  }

  async isBatchDeleteDialogVisible(): Promise<boolean> {
    return await this.batchDeleteDialog.isVisible()
  }

  async getBatchDeleteDialogText(): Promise<string | null> {
    return await this.batchDeleteDialog.textContent()
  }

  async isBatchDeleteButtonLoading(): Promise<boolean> {
    const button = this.batchDeleteConfirmButton
    const isDisabled = await button.isDisabled()
    const hasLoadingText = await button.textContent()
    return isDisabled && hasLoadingText?.includes('刪除中')
  }

  async waitForBatchDeleteComplete() {
    await this.page.waitForResponse((response) =>
      response.url().includes('/expenses/batch') &&
      response.request().method() === 'DELETE' &&
      response.status() === 200
    )
  }

  async waitForExpenseCountChange(previousCount: number) {
    await this.page.waitForFunction(
      (count) => {
        const rows = document.querySelectorAll('[data-testid="row-checkbox"]')
        return rows.length !== count
      },
      previousCount,
      { timeout: 10000 }
    )
  }

  async waitForDialogClose() {
    await this.batchDeleteDialog.waitFor({ state: 'hidden', timeout: 5000 })
  }
}
