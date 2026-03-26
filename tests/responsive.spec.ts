import { test, expect } from '../fixtures/test-fixtures'
import { loginByApi } from '../helpers/login-by-api'

// Mobile 375px
test.describe('Mobile View (375px)', () => {
  test.use({ viewport: { width: 375, height: 812 } })

  test.beforeEach(async ({ page, apiHelper }) => {
    await loginByApi(page, apiHelper, {
      email: process.env.E2E_TEST_EMAIL || 'e2e_core@example.com',
      password: process.env.E2E_TEST_PASSWORD || 'password',
    })
    await page.waitForLoadState('networkidle')
  })

  test('hero title and add button are visible', async ({ page }) => {
    await expect(page.getByTestId('dashboard-hero-title')).toBeVisible()
    await expect(page.getByTestId('dashboard-add-expense')).toBeVisible()
  })

  test('hero mini stats 2x2 grid is visible (all 4 cards)', async ({ page }) => {
    await expect(page.getByTestId('stats-card-today')).toBeVisible()
    await expect(page.getByTestId('stats-card-week')).toBeVisible()
    await expect(page.getByTestId('stats-card-month')).toBeVisible()
    await expect(page.getByTestId('stats-card-impulse')).toBeVisible()
  })

  test('intent donut chart is visible', async ({ page }) => {
    await expect(page.getByTestId('intent-donut-chart')).toBeVisible()
  })

  test('expense form modal is usable on mobile', async ({ page }) => {
    await page.getByTestId('dashboard-add-expense').click()
    await expect(page.getByTestId('expense-form-modal')).toBeVisible()
    await expect(page.getByRole('spinbutton', { name: '金額' })).toBeVisible()
  })
})

// Tablet 768px
test.describe('Tablet View (768px)', () => {
  test.use({ viewport: { width: 768, height: 1024 } })

  test.beforeEach(async ({ page, apiHelper }) => {
    await loginByApi(page, apiHelper, {
      email: process.env.E2E_TEST_EMAIL || 'e2e_core@example.com',
      password: process.env.E2E_TEST_PASSWORD || 'password',
    })
    await page.waitForLoadState('networkidle')
  })

  test('hero title and add button are visible', async ({ page }) => {
    await expect(page.getByTestId('dashboard-hero-title')).toBeVisible()
    await expect(page.getByTestId('dashboard-add-expense')).toBeVisible()
  })

  test('hero mini stats 2x2 grid is visible (all 4 cards)', async ({ page }) => {
    await expect(page.getByTestId('stats-card-today')).toBeVisible()
    await expect(page.getByTestId('stats-card-week')).toBeVisible()
    await expect(page.getByTestId('stats-card-month')).toBeVisible()
    await expect(page.getByTestId('stats-card-impulse')).toBeVisible()
  })

  test('intent donut chart is visible', async ({ page }) => {
    await expect(page.getByTestId('intent-donut-chart')).toBeVisible()
  })
})

// Desktop 1280px
test.describe('Desktop View (1280px)', () => {
  test.use({ viewport: { width: 1280, height: 800 } })

  test.beforeEach(async ({ page, apiHelper }) => {
    await loginByApi(page, apiHelper, {
      email: process.env.E2E_TEST_EMAIL || 'e2e_core@example.com',
      password: process.env.E2E_TEST_PASSWORD || 'password',
    })
    await page.waitForLoadState('networkidle')
  })

  test('hero title and add button are visible', async ({ page }) => {
    await expect(page.getByTestId('dashboard-hero-title')).toBeVisible()
    await expect(page.getByTestId('dashboard-add-expense')).toBeVisible()
  })

  test('hero mini stats 2x2 grid is visible (all 4 cards)', async ({ page }) => {
    await expect(page.getByTestId('stats-card-today')).toBeVisible()
    await expect(page.getByTestId('stats-card-week')).toBeVisible()
    await expect(page.getByTestId('stats-card-month')).toBeVisible()
    await expect(page.getByTestId('stats-card-impulse')).toBeVisible()
  })

  test('intent donut chart is visible', async ({ page }) => {
    await expect(page.getByTestId('intent-donut-chart')).toBeVisible()
  })

  test('navigation header is visible', async ({ page }) => {
    await expect(page.locator('header')).toBeVisible()
  })
})
