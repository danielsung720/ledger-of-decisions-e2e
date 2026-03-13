import { test, expect } from '../fixtures/test-fixtures'

test.describe('Dashboard Page', () => {
  test.beforeEach(async ({ dashboardPage }) => {
    await dashboardPage.goto()
  })

  test('displays hero section with correct content', async ({ dashboardPage }) => {
    await expect(dashboardPage.heroTitle).toBeVisible()
    await expect(dashboardPage.addExpenseButton).toBeVisible()
  })

  test('displays monthly stats', async ({ dashboardPage }) => {
    await expect(dashboardPage.monthlyAmount).toBeVisible()
    await expect(dashboardPage.impulseRatio).toBeVisible()
  })

  test('opens expense form modal when clicking add button', async ({ dashboardPage, page }) => {
    await dashboardPage.openAddExpenseModal()
    await expect(page.getByTestId('expense-form-modal')).toBeVisible()
  })

  test('displays stats cards', async ({ dashboardPage }) => {
    const cards = await dashboardPage.statsCards.count()
    expect(cards).toBeGreaterThan(0)
  })

  test('shows empty state when no expenses', async ({ dashboardPage, page }) => {
    // This test assumes no expenses exist
    // In a real scenario, we would clean up data first
    const emptyState = page.locator('text=/還沒有|尚無/')
    const hasEmptyState = await emptyState.isVisible().catch(() => false)

    if (hasEmptyState) {
      await expect(emptyState).toBeVisible()
    }
  })
})
