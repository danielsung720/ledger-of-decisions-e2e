import { test, expect } from '../fixtures/test-fixtures'
import type { Page } from '@playwright/test'
import { loginByApi } from '../helpers/login-by-api'

async function waitForRecurringListReady(page: Page) {
  await page.waitForLoadState('networkidle')
  await expect(page.getByTestId('recurring-page-title')).toBeVisible()
}

async function waitForRecurringListResponse(page: Page, isActive: 'true' | 'false' | null) {
  return page.waitForResponse((response) => {
    if (response.request().method() !== 'GET') return false
    if (!response.url().includes('/api/recurring-expenses?')) return false
    const value = new URL(response.url()).searchParams.get('is_active')
    return value === isActive
  })
}

async function openRecurringCreateModal(page: Page) {
  const openButton = page.getByTestId('recurring-add-button')
  const nameInput = page.getByPlaceholder('例如：車貸、Netflix 訂閱')

  await waitForRecurringListReady(page)
  await openButton.click()
  const openedOnFirstClick = await nameInput.isVisible().catch(() => false)
  if (!openedOnFirstClick) {
    await openButton.click()
  }

  await expect(nameInput).toBeVisible({ timeout: 10000 })
  return nameInput
}

test.describe('Recurring Expense API Pages', () => {
  test.beforeEach(async ({ page, apiHelper }) => {
    await loginByApi(page, apiHelper, {
      email: process.env.E2E_RECURRING_EMAIL || 'recurring_e2e@example.com',
      password: process.env.E2E_RECURRING_PASSWORD || 'password',
    })
  })

  test('submits recurring create request with normalized optional fields', async ({ page }) => {
    await page.goto('/recurring')

    const recurringName = `E2E Recurring ${Date.now()}`
    const nameInput = await openRecurringCreateModal(page)
    await nameInput.fill(recurringName)
    await page.getByRole('spinbutton', { name: /金額/ }).fill('1280')

    await page.getByRole('button', { name: '請選擇分類' }).click()
    await page.getByRole('option', { name: /生活/ }).click()

    await page.getByLabel('備註（選填）').fill('  autopay  ')

    const requestPromise = page.waitForRequest((request) =>
      request.method() === 'POST' && request.url().includes('/api/recurring-expenses')
    )

    await page.getByRole('button', { name: '儲存' }).click()

    const request = await requestPromise
    const body = request.postDataJSON() as Record<string, unknown>

    expect(body.name).toBe(recurringName)
    expect(Number(body.amount_min)).toBe(1280)
    expect(body.category).toBe('living')
    expect(body.frequency_type).toBe('monthly')
    expect(body.note).toBe('autopay')

    await expect(page.getByRole('heading', { name: '新增固定支出' })).toBeHidden({ timeout: 10000 })
  })

  test('requests active filter with is_active query parameter', async ({ page }) => {
    await page.goto('/recurring')
    await waitForRecurringListReady(page)

    const toAllResponse = waitForRecurringListResponse(page, null)
    await page.getByTestId('recurring-filter-all').click()
    await toAllResponse

    const toActiveResponse = waitForRecurringListResponse(page, 'true')

    await page.getByTestId('recurring-filter-active').click()
    const response = await toActiveResponse
    const url = new URL(response.url())

    expect(url.searchParams.get('is_active')).toBe('true')
    expect(url.searchParams.get('page')).toBe('1')
  })

  test('submits recurring update request without blank optional note', async ({ page, apiHelper }) => {
    await apiHelper.cleanupRecurringTestData()
    const recurringName = `E2E Edit Recurring ${Date.now()}`
    const created = await apiHelper.createRecurringExpense({
      name: recurringName,
      amount_min: 900,
      category: 'living',
      frequency_type: 'monthly',
      start_date: '2026-02-01',
    })
    const recurringId = created?.data?.id as number
    expect(recurringId).toBeTruthy()

    await page.goto('/recurring')
    const recurringRow = page.locator('div.group', { hasText: recurringName }).first()
    await recurringRow.hover()
    await recurringRow.getByRole('button', { name: '編輯' }).click()

    await expect(page.getByRole('heading', { name: '編輯固定支出' })).toBeVisible({ timeout: 10000 })

    await page.getByLabel('名稱').fill(`E2E Recurring Updated ${Date.now()}`)
    await page.getByLabel('備註（選填）').fill('   ')

    const requestPromise = page.waitForRequest((request) =>
      request.method() === 'PUT' && request.url().includes(`/api/recurring-expenses/${recurringId}`)
    )

    await page.getByRole('button', { name: '更新' }).click()

    const request = await requestPromise
    const body = request.postDataJSON() as Record<string, unknown>

    expect(body.name).toContain('E2E Recurring Updated')
    expect(body.note).toBeNull()
  })
})
