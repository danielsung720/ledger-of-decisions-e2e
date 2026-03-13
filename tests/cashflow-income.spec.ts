import { test, expect } from '../fixtures/test-fixtures'
import type { Page } from '@playwright/test'
import { loginByApi } from '../helpers/login-by-api'

async function createIncome(page: Page, name: string, amount: string) {
  const addIncomeButton = page.getByTestId('btn-add-income')
  const incomeNameInput = page.getByPlaceholder('例如：薪資、年終獎金')

  await addIncomeButton.click()
  const openedOnFirstClick = await incomeNameInput.isVisible().catch(() => false)
  if (!openedOnFirstClick) {
    await addIncomeButton.click()
  }

  await expect(incomeNameInput).toBeVisible({ timeout: 10000 })
  await incomeNameInput.fill(name)
  await page.getByRole('spinbutton', { name: '金額' }).fill(amount)
  await page.getByRole('button', { name: '儲存' }).click()
  await expect(incomeNameInput).toBeHidden({ timeout: 10000 })
  await expect(page.locator('tr', { hasText: name })).toBeVisible({ timeout: 10000 })
}

test.describe('Cashflow Income CRUD', () => {
  test.describe.configure({ mode: 'serial' })

  test.beforeEach(async ({ page, apiHelper }) => {
    await loginByApi(page, apiHelper, {
      email: process.env.E2E_CASHFLOW_INCOME_EMAIL || 'cashflow_income@example.com',
      password: process.env.E2E_CASHFLOW_INCOME_PASSWORD || 'password',
    })

    await page.goto('/cashflow')
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('heading', { name: '每月現金流估算' })).toBeVisible()
  })

  test('creates income and renders it in income table', async ({ page }) => {
    const name = `E2E Income ${Date.now()}`

    await createIncome(page, name, '52000')

    await expect(page.locator('tr', { hasText: name })).toContainText('$52,000')
  })

  test('edits income and shows updated value', async ({ page }) => {
    const name = `E2E Income ${Date.now()}`
    const updatedName = `${name} Updated`

    await createIncome(page, name, '46000')

    const row = page.locator('tr', { hasText: name }).first()
    await row.locator('button[title="編輯"]').click()
    await expect(page.getByPlaceholder('例如：薪資、年終獎金')).toBeVisible()

    await page.getByPlaceholder('例如：薪資、年終獎金').fill(updatedName)
    await page.getByRole('spinbutton', { name: '金額' }).fill('47000')
    await page.getByRole('button', { name: '更新' }).click()

    await expect(page.locator('tr', { hasText: updatedName })).toContainText('$47,000', { timeout: 10000 })
  })

  test('deletes income and removes it from table', async ({ page }) => {
    const name = `E2E Income ${Date.now()}`

    await createIncome(page, name, '38000')

    const row = page.locator('tr', { hasText: name }).first()
    await row.locator('button[title="刪除"]').click()
    await page.getByRole('button', { name: '確認' }).click()

    await expect(page.locator('tr', { hasText: name })).toHaveCount(0, { timeout: 10000 })
  })

  test('requests projection with selected month range when switching month selector', async ({ page }) => {
    const projectionRequest = page.waitForRequest((request) => {
      return request.method() === 'GET'
        && request.url().includes('/api/cash-flow/projection')
        && request.url().includes('months=6')
    })

    await page.getByTestId('cashflow-month-6').click()
    const request = await projectionRequest

    const months = new URL(request.url()).searchParams.get('months')
    expect(months).toBe('6')
    await expect(page.getByRole('heading', { name: '多月預測 (6 個月)' })).toBeVisible()
  })

  test('requests projection for 1 and 12 month options', async ({ page }) => {
    const requestForTwelveMonths = page.waitForRequest((request) => {
      return request.method() === 'GET'
        && request.url().includes('/api/cash-flow/projection')
        && request.url().includes('months=12')
    })
    await page.getByTestId('cashflow-month-12').click()
    const twelveMonthRequest = await requestForTwelveMonths
    expect(new URL(twelveMonthRequest.url()).searchParams.get('months')).toBe('12')

    const requestForOneMonth = page.waitForRequest((request) => {
      return request.method() === 'GET'
        && request.url().includes('/api/cash-flow/projection')
        && request.url().includes('months=1')
    })
    await page.getByTestId('cashflow-month-1').click()
    const oneMonthRequest = await requestForOneMonth
    expect(new URL(oneMonthRequest.url()).searchParams.get('months')).toBe('1')
    await expect(page.getByRole('heading', { name: '多月預測 (1 個月)' })).toBeVisible()
  })

  test('keeps page interactive when projection request fails', async ({ page }) => {
    await page.route('**/api/cash-flow/projection**', async (route) => {
      const url = route.request().url()
      if (route.request().method() === 'GET' && url.includes('months=12')) {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'projection failed' }),
        })
        return
      }

      await route.continue()
    })

    const requestForFailedProjection = page.waitForRequest((request) => {
      return request.method() === 'GET'
        && request.url().includes('/api/cash-flow/projection')
        && request.url().includes('months=12')
    })
    await page.getByTestId('cashflow-month-12').click()
    await requestForFailedProjection
    await expect(page.getByRole('heading', { name: '多月預測 (12 個月)' })).toBeVisible()

    const requestForRecovery = page.waitForRequest((request) => {
      return request.method() === 'GET'
        && request.url().includes('/api/cash-flow/projection')
        && request.url().includes('months=6')
    })
    await page.getByTestId('cashflow-month-6').click()
    const recoveryRequest = await requestForRecovery
    expect(new URL(recoveryRequest.url()).searchParams.get('months')).toBe('6')
    await expect(page.getByRole('heading', { name: '多月預測 (6 個月)' })).toBeVisible()

    await page.unroute('**/api/cash-flow/projection**')
  })
})
