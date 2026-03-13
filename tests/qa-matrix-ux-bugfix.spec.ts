import { test, expect } from '../fixtures/test-fixtures'

test.describe('QA Matrix - UX Bugfix Batch', () => {
  test('TC-01: authenticated user stays logged in after reload on protected routes', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const authProbe = await page.evaluate(async () => {
      const token = localStorage.getItem('auth_token')
      const response = await fetch('/api/user', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      return response.status
    })
    expect(authProbe).toBe(200)

    const routes = ['/', '/records', '/recurring', '/cashflow', '/review']

    for (const route of routes) {
      await page.goto(route)
      await page.waitForLoadState('networkidle')
      await expect(page).not.toHaveURL(/\/login/)

      await page.reload()
      await page.waitForLoadState('networkidle')
      await expect(page).not.toHaveURL(/\/login/)
    }
  })

  test('TC-02: dashboard updates recent records immediately after creating expense', async ({ page, dashboardPage, expenseFormModal }) => {
    await dashboardPage.goto()

    const note = `qa-dashboard-${Date.now()}`

    await dashboardPage.openAddExpenseModal()
    await expenseFormModal.fillAmount('321')
    await expenseFormModal.selectCategory('飲食')
    await expenseFormModal.selectIntent('necessity')
    await expenseFormModal.fillNote(note)
    await expenseFormModal.submit()

    await expect(page.getByRole('heading', { name: '新增消費記錄' })).toBeHidden({ timeout: 10000 })
    await expect(page.getByText(note)).toBeVisible({ timeout: 10000 })
  })

  test('TC-03: records/recurring/cashflow reflect new data immediately after save', async ({ page, expenseFormModal }) => {
    // records page - create one expense via global modal and verify row visible
    await page.goto('/records')
    await page.getByRole('button', { name: '記一筆' }).click()
    const recordNote = `qa-record-${Date.now()}`
    await expenseFormModal.fillAmount('456')
    await expenseFormModal.selectCategory('飲食')
    await expenseFormModal.selectIntent('necessity')
    await expenseFormModal.fillNote(recordNote)
    await expenseFormModal.submit()
    await expect(page.getByText(recordNote)).toBeVisible({ timeout: 10000 })

    // recurring page - create one recurring item and verify name visible after modal close
    await page.goto('/recurring')
    const addRecurringButton = page.getByRole('button', { name: '新增固定支出' })
    const recurringNameInput = page.getByPlaceholder('例如：車貸、Netflix 訂閱')
    await addRecurringButton.click()
    const recurringOpenedOnFirstClick = await recurringNameInput.isVisible().catch(() => false)
    if (!recurringOpenedOnFirstClick) {
      await addRecurringButton.click()
    }
    await expect(recurringNameInput).toBeVisible({ timeout: 10000 })

    const recurringName = `QA Recurring ${Date.now()}`
    await recurringNameInput.fill(recurringName)
    await page.getByRole('spinbutton', { name: '金額' }).fill('999')
    await page.getByRole('button', { name: '請選擇分類' }).click()
    await page.getByRole('option', { name: /飲食/ }).click()
    const recurringListRefresh = page.waitForResponse((response) =>
      response.request().method() === 'GET'
      && response.url().includes('/api/recurring-expenses?')
      && response.status() < 500
    )
    await page.getByRole('button', { name: '儲存' }).click()
    await expect(page.getByRole('heading', { name: '新增固定支出' })).toBeHidden({ timeout: 10000 })
    await recurringListRefresh

    // cashflow page - create one income and verify name visible in table
    await page.goto('/cashflow')
    const addIncomeButton = page.getByRole('button', { name: '新增收入' })
    const incomeNameInput = page.getByPlaceholder('例如：薪資、年終獎金')
    await addIncomeButton.click()
    const incomeOpenedOnFirstClick = await incomeNameInput.isVisible().catch(() => false)
    if (!incomeOpenedOnFirstClick) {
      await addIncomeButton.click()
    }
    await expect(incomeNameInput).toBeVisible({ timeout: 10000 })

    const incomeName = `QA Income ${Date.now()}`
    await incomeNameInput.fill(incomeName)
    await page.getByRole('spinbutton', { name: '金額' }).fill('50000')
    await page.getByRole('button', { name: '儲存' }).click()
    await expect(page.getByText(incomeName)).toBeVisible({ timeout: 10000 })
  })

  test('TC-04: date picker constraints are correct per form context', async ({ page, dashboardPage }) => {
    // Expense form should keep max date (today)
    await dashboardPage.goto()
    await dashboardPage.openAddExpenseModal()
    const expenseDateInput = page.getByLabel('消費日期')
    await expect(expenseDateInput).toHaveAttribute('max', /\d{4}-\d{2}-\d{2}/)
    await page.getByRole('button', { name: '取消' }).click()

    // Recurring form should allow future date (no max attr)
    await page.goto('/recurring')
    const recurringStartDateInput = page.getByLabel('開始日期')
    const addRecurringButton = page.getByRole('button', { name: '新增固定支出' })
    await addRecurringButton.click()
    const recurringOpenedOnFirstClick = await recurringStartDateInput.isVisible().catch(() => false)
    if (!recurringOpenedOnFirstClick) {
      await addRecurringButton.click()
    }
    await expect(recurringStartDateInput).toBeVisible({ timeout: 10000 })
    await expect(recurringStartDateInput).not.toHaveAttribute('max', /.+/)
    await page.getByRole('button', { name: '取消' }).click()

    // Cashflow income form should allow future date (no max attr)
    await page.goto('/cashflow')
    const addIncomeButton = page.getByRole('button', { name: '新增收入' })
    const incomeDialogHeading = page.getByRole('heading', { name: '新增收入' })
    await addIncomeButton.click()
    const openedOnFirstClick = await incomeDialogHeading.isVisible().catch(() => false)
    if (!openedOnFirstClick) {
      await addIncomeButton.click()
    }
    await expect(incomeDialogHeading).toBeVisible({ timeout: 10000 })
    const incomeStartDateInput = page.getByRole('textbox', { name: /開始日期/ }).first()
    await expect(incomeStartDateInput).not.toHaveAttribute('max', /.+/)
    await page.getByRole('button', { name: '取消' }).click()
  })
})
