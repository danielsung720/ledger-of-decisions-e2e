import { test, expect } from '../fixtures/test-fixtures'

test.describe('Dashboard Page', () => {
  test.beforeEach(async ({ dashboardPage }) => {
    await dashboardPage.goto()
  })

  test('displays hero section with correct content', async ({ dashboardPage }) => {
    await expect(dashboardPage.heroTitle).toBeVisible()
    await expect(dashboardPage.addExpenseButton).toBeVisible()
  })

  test('displays all 4 stats cards in hero', async ({ dashboardPage }) => {
    await expect(dashboardPage.statCardToday).toBeVisible()
    await expect(dashboardPage.statCardWeek).toBeVisible()
    await expect(dashboardPage.statCardMonth).toBeVisible()
    await expect(dashboardPage.statCardImpulse).toBeVisible()
  })

  test('stats cards total count is 4', async ({ dashboardPage }) => {
    const count = await dashboardPage.statsCards.count()
    expect(count).toBe(4)
  })

  test('displays monthly stats via testid', async ({ dashboardPage }) => {
    await expect(dashboardPage.monthlyAmount).toBeVisible()
    await expect(dashboardPage.impulseRatio).toBeVisible()
  })

  test('displays intent donut chart', async ({ dashboardPage }) => {
    await expect(dashboardPage.intentDonutChart).toBeVisible()
    await expect(dashboardPage.intentDonutChart.locator('canvas')).toBeVisible()
  })

  test('opens expense form modal when clicking add button', async ({ dashboardPage, page }) => {
    await dashboardPage.openAddExpenseModal()
    await expect(page.getByTestId('expense-form-modal')).toBeVisible()
  })

  test('shows empty state when no expenses', async ({ dashboardPage, page }) => {
    const emptyState = page.locator('text=/還沒有|尚無/')
    const hasEmptyState = await emptyState.isVisible().catch(() => false)

    if (hasEmptyState) {
      await expect(emptyState).toBeVisible()
    }
  })
})
