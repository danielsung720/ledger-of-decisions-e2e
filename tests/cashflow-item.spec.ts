import { test, expect } from '../fixtures/test-fixtures'
import type { Page } from '@playwright/test'
import { loginByApi } from '../helpers/login-by-api'

async function openCashFlowItemModal(page: Page) {
  const addExpenseButton = page
    .getByTestId('btn-add-expense')
    .or(page.getByRole('button', { name: '新增支出' }))
  const itemNameInput = page.getByPlaceholder('例如：房租、電費')

  await expect(addExpenseButton.first()).toBeVisible({ timeout: 10000 })
  await addExpenseButton.click()
  await expect(itemNameInput).toBeVisible({ timeout: 10000 })
  return itemNameInput
}

async function createCashFlowItem(page: Page, name: string, amount: string) {
  const itemNameInput = await openCashFlowItemModal(page)

  await itemNameInput.fill(name)
  await page.getByRole('spinbutton', { name: '金額' }).fill(amount)
  await page.getByRole('button', { name: '請選擇分類' }).click()
  await page.getByRole('option', { name: /生活/ }).first().click()
  await page.getByRole('button', { name: '儲存' }).click()

  await expect(itemNameInput).toBeHidden({ timeout: 10000 })
  await expect(page.locator('tr', { hasText: name })).toBeVisible({ timeout: 10000 })
}

test.describe('Cashflow Item CRUD', () => {
  test.describe.configure({ mode: 'serial' })

  test.beforeEach(async ({ page, apiHelper }) => {
    await loginByApi(page, apiHelper, {
      email: process.env.E2E_CASHFLOW_ITEM_EMAIL || 'cashflow_item@example.com',
      password: process.env.E2E_CASHFLOW_ITEM_PASSWORD || 'password',
    })

    await page.goto('/cashflow')
    const cashflowTitle = page.getByRole('heading', { name: '每月現金流估算' })
    const loadedOnFirstTry = await cashflowTitle.isVisible().catch(() => false)
    if (!loadedOnFirstTry) {
      await page.goto('/cashflow')
    }

    await expect(page).toHaveURL(/\/cashflow/)
    await page.waitForLoadState('networkidle')
    await expect(cashflowTitle).toBeVisible({ timeout: 10000 })
  })

  test('creates cashflow item and renders it in expense table', async ({ page }) => {
    const name = `E2E Item ${Date.now()}`

    await createCashFlowItem(page, name, '26000')

    await expect(page.locator('tr', { hasText: name })).toContainText('$26,000')
    await expect(page.locator('tr', { hasText: name })).toContainText('生活')
  })

  test('shows validation errors when submitting empty cashflow item form', async ({ page }) => {
    await openCashFlowItemModal(page)
    await page.getByRole('button', { name: '儲存' }).click()

    await expect(page.getByText('請輸入項目名稱')).toBeVisible()
    await expect(page.getByText('請輸入有效金額')).toBeVisible()
    await expect(page.getByText('請選擇消費分類')).toBeVisible()
    await expect(page.getByPlaceholder('例如：房租、電費')).toBeVisible()
  })

  test('keeps modal open when create request fails', async ({ page }) => {
    const name = `E2E Item ${Date.now()}`
    await page.route('**/api/cash-flow-items', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Server error' }),
        })
        return
      }
      await route.continue()
    })

    const itemNameInput = await openCashFlowItemModal(page)
    await itemNameInput.fill(name)
    await page.getByRole('spinbutton', { name: '金額' }).fill('15000')
    await page.getByRole('button', { name: '請選擇分類' }).click()
    await page.getByRole('option', { name: /生活/ }).first().click()
    await page.getByRole('button', { name: '儲存' }).click()

    await expect(page.getByPlaceholder('例如：房租、電費')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('tr', { hasText: name })).toHaveCount(0)
    await page.unroute('**/api/cash-flow-items')
  })

  test('prevents duplicate create requests while first submit is pending', async ({ page }) => {
    const name = `E2E Item ${Date.now()}`
    let createCallCount = 0

    await page.route('**/api/cash-flow-items', async (route) => {
      if (route.request().method() !== 'POST') {
        await route.continue()
        return
      }

      createCallCount += 1
      await page.waitForTimeout(500)
      await route.continue()
    })

    const itemNameInput = await openCashFlowItemModal(page)
    await itemNameInput.fill(name)
    await page.getByRole('spinbutton', { name: '金額' }).fill('22000')
    await page.getByRole('button', { name: '請選擇分類' }).click()
    await page.getByRole('option', { name: /生活/ }).first().click()

    const saveButton = page.getByRole('button', { name: '儲存' })
    await saveButton.click()
    await saveButton.click({ timeout: 1500 }).catch(() => {})

    await expect(page.locator('tr', { hasText: name })).toBeVisible({ timeout: 10000 })
    expect(createCallCount).toBe(1)
    await page.unroute('**/api/cash-flow-items')
  })

  test('edits cashflow item and shows updated values', async ({ page }) => {
    const name = `E2E Item ${Date.now()}`
    const updatedName = `${name} Updated`

    await createCashFlowItem(page, name, '18000')

    const row = page.locator('tr', { hasText: name }).first()
    await row.locator('button[title="編輯"]').click()

    const itemNameInput = page.getByPlaceholder('例如：房租、電費')
    await expect(itemNameInput).toBeVisible({ timeout: 10000 })
    await itemNameInput.fill(updatedName)
    await page.getByRole('spinbutton', { name: '金額' }).fill('19000')
    await page.getByRole('button', { name: '更新' }).click()

    await expect(page.locator('tr', { hasText: updatedName })).toContainText('$19,000', { timeout: 10000 })
  })

  test('deletes cashflow item and removes it from expense table', async ({ page }) => {
    const name = `E2E Item ${Date.now()}`

    await createCashFlowItem(page, name, '12000')

    const row = page.locator('tr', { hasText: name }).first()
    await row.locator('button[title="刪除"]').click()
    await page.getByRole('button', { name: '確認' }).click()

    await expect(page.locator('tr', { hasText: name })).toHaveCount(0, { timeout: 10000 })
  })
})
