import { test, expect } from '../fixtures/test-fixtures'

test.describe('Navigation', () => {
  test('navigates to dashboard from root', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL('/')
    await expect(page.getByTestId('dashboard-hero-title')).toBeVisible()
  })

  test('navigates to expense list', async ({ page }) => {
    await page.goto('/')

    // Find and click navigation link to expenses
    const expenseLink = page.getByTestId('nav-link-records')
    await expenseLink.click()
    await expect(page).toHaveURL(/\/records/)
  })

  test('navigates to review page', async ({ page }) => {
    await page.goto('/')

    // Find and click navigation link to review
    const reviewLink = page.getByRole('link', { name: /回顧|分析/ })
    if (await reviewLink.isVisible()) {
      await reviewLink.click()
      await expect(page).toHaveURL(/\/review/)
    }
  })

  test('navigates to recurring expenses', async ({ page }) => {
    await page.goto('/')

    // Find and click navigation link to recurring
    const recurringLink = page.getByRole('link', { name: /固定|定期/ })
    if (await recurringLink.isVisible()) {
      await recurringLink.click()
      await expect(page).toHaveURL(/\/recurring/)
    }
  })

  test('header is visible on all pages', async ({ page }) => {
    const pages = ['/', '/records', '/review']

    for (const path of pages) {
      await page.goto(path)
      const header = page.locator('header')
      await expect(header).toBeVisible()
    }
  })

  test('logo links to home', async ({ page }) => {
    await page.goto('/records')

    const logo = page.getByRole('link', { name: /Ledger of Decisions/ })
    await logo.click()

    await expect(page).toHaveURL('/')
  })
})
