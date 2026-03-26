import { test, expect } from '../fixtures/test-fixtures'
import { loginByApi } from '../helpers/login-by-api'

test.describe('Review Page', () => {
  test.beforeEach(async ({ reviewPage, page, apiHelper }) => {
    await loginByApi(page, apiHelper, {
      email: process.env.E2E_TEST_EMAIL || 'e2e_core@example.com',
      password: process.env.E2E_TEST_PASSWORD || 'password',
    })
    await reviewPage.goto()
    const loadedOnFirstTry = await reviewPage.pageTitle.isVisible().catch(() => false)
    if (!loadedOnFirstTry) {
      await reviewPage.goto()
    }

    await expect(page).toHaveURL(/\/review/)
    await expect(reviewPage.pageTitle).toBeVisible()
  })

  test('displays page title', async ({ reviewPage }) => {
    await expect(reviewPage.pageTitle).toBeVisible()
  })

  test('displays date range selector', async ({ reviewPage }) => {
    await expect(reviewPage.thisWeekButton).toBeVisible()
    await expect(reviewPage.thisMonthButton).toBeVisible()
    await expect(reviewPage.customButton).toBeVisible()
  })

  test('displays overview cards', async ({ reviewPage }) => {
    await expect(reviewPage.totalAmountCard).toBeVisible()
    await expect(reviewPage.impulseRatioCard).toBeVisible()
    await expect(reviewPage.trendCard).toBeVisible()
  })

  test('changes date range when selecting preset', async ({ reviewPage }) => {
    // Select this week
    await reviewPage.selectDateRange('this_week')
    await expect(reviewPage.thisWeekButton).toHaveClass(/bg-theme-primary/)

    // Select this month
    await reviewPage.selectDateRange('this_month')
    await expect(reviewPage.thisMonthButton).toHaveClass(/bg-theme-primary/)
  })

  test('requests summary API with selected preset', async ({ reviewPage }) => {
    const todayResponsePromise = reviewPage.waitForApi('/statistics/summary?preset=today')
    await reviewPage.selectDateRange('today')
    await todayResponsePromise

    const weekResponsePromise = reviewPage.waitForApi('/statistics/summary?preset=this_week')
    await reviewPage.selectDateRange('this_week')
    await weekResponsePromise
  })

  test('shows custom date inputs when selecting custom range', async ({ reviewPage }) => {
    await reviewPage.selectDateRange('custom')

    await expect(reviewPage.startDateInput).toBeVisible()
    await expect(reviewPage.endDateInput).toBeVisible()
  })

  test('requests summary API with custom date range query params', async ({ reviewPage, page }) => {
    const summaryUrls: string[] = []
    page.on('response', (response) => {
      const url = response.url()
      if (url.includes('/statistics/summary')) {
        summaryUrls.push(url)
      }
    })

    await reviewPage.selectDateRange('custom')
    await reviewPage.startDateInput.evaluate((el) => {
      const input = el as HTMLInputElement
      input.value = '2026-02-01'
      input.dispatchEvent(new Event('input', { bubbles: true }))
      input.dispatchEvent(new Event('change', { bubbles: true }))
    })
    await reviewPage.endDateInput.evaluate((el) => {
      const input = el as HTMLInputElement
      input.value = '2026-02-28'
      input.dispatchEvent(new Event('input', { bubbles: true }))
      input.dispatchEvent(new Event('change', { bubbles: true }))
    })

    await expect.poll(() => {
      return summaryUrls.some((url) => {
        const parsed = new URL(url)
        return parsed.searchParams.get('start_date') === '2026-02-01'
          && parsed.searchParams.get('end_date') === '2026-02-28'
      })
    }, {
      timeout: 10000,
      message: `Captured summary URLs: ${summaryUrls.join(' | ')}`,
    }).toBe(true)
  })

  test('displays total amount in currency format', async ({ reviewPage }) => {
    const amount = await reviewPage.getTotalAmount()
    expect(amount).toMatch(/\$[\d,]+/)
  })

  test('displays impulse ratio as percentage', async ({ reviewPage }) => {
    const ratio = await reviewPage.getImpulseRatio()
    expect(ratio).toMatch(/\d+%/)
  })

  test('applies correct color to impulse ratio', async ({ reviewPage, page }) => {
    // Check if impulse ratio has success or error color in theme system
    const ratioElement = reviewPage.impulseRatioCard.locator('.font-number')
    const hasSuccessClass = await ratioElement.evaluate((el) =>
      el.classList.contains('text-theme-success')
    )
    const hasErrorClass = await ratioElement.evaluate((el) =>
      el.classList.contains('text-theme-error')
    )

    // Should have one of the colors
    expect(hasSuccessClass || hasErrorClass).toBe(true)
  })
})
