import { test, expect } from '../fixtures/test-fixtures'

// Mobile tests - using viewport instead of devices to avoid worker issues
test.describe('Mobile View', () => {
  test.use({ viewport: { width: 390, height: 844 } }) // iPhone 12 dimensions

  test('dashboard displays correctly on mobile', async ({ page }) => {
    await page.goto('/')

    // Hero section should be visible
    await expect(page.getByTestId('dashboard-hero-title')).toBeVisible()

    // Add button should be visible
    await expect(page.getByTestId('dashboard-add-expense')).toBeVisible()
  })

  test('expense form modal is usable on mobile', async ({ page }) => {
    await page.goto('/')
    await page.getByTestId('dashboard-add-expense').click()

    await expect(page.getByTestId('expense-form-modal')).toBeVisible()

    // Form fields should be usable
    const amountInput = page.getByRole('spinbutton', { name: '金額' })
    await expect(amountInput).toBeVisible()
  })
})

// Tablet tests
test.describe('Tablet View', () => {
  test.use({ viewport: { width: 1024, height: 1366 } }) // iPad Pro dimensions

  test('dashboard displays correctly on tablet', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByTestId('dashboard-hero-title')).toBeVisible()
  })

  test('stats cards are visible on tablet', async ({ page }) => {
    await page.goto('/')

    const statsCards = page.locator('.card')
    const count = await statsCards.count()
    expect(count).toBeGreaterThan(0)
  })
})

// Desktop tests
test.describe('Desktop View', () => {
  test.use({ viewport: { width: 1920, height: 1080 } })

  test('dashboard uses full width on desktop', async ({ page }) => {
    await page.goto('/')

    // Page should load successfully
    await expect(page.getByTestId('dashboard-hero-title')).toBeVisible()
  })

  test('navigation is visible on desktop', async ({ page }) => {
    await page.goto('/')

    // Header/nav should be visible
    const header = page.locator('header')
    await expect(header).toBeVisible()
  })
})
