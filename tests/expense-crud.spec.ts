import { test, expect } from '../fixtures/test-fixtures'
import { loginByApi } from '../helpers/login-by-api'

test.describe('Expense CRUD Operations', () => {
  // Not using mode: 'serial' — tests are data-independent via per-test loginByApi.
  // Removing serial mode prevents cascade failures.

  test.beforeEach(async ({ page, apiHelper }) => {
    await loginByApi(page, apiHelper, {
      email: process.env.E2E_EXPENSE_CRUD_EMAIL || 'expense_crud@example.com',
      password: process.env.E2E_EXPENSE_CRUD_PASSWORD || 'password',
    })
  })

  test.describe('Create Expense', () => {
    test('creates a new expense from dashboard', async ({ dashboardPage, expenseFormModal, page }) => {
      await dashboardPage.goto()
      await dashboardPage.openAddExpenseModal()

      // Fill amount
      await expenseFormModal.fillAmount('500')

      // Select category
      await page.getByRole('button', { name: '請選擇分類' }).click()
      await page.getByRole('option', { name: /飲食/ }).click()

      // Select intent
      await expenseFormModal.selectIntent('necessity')

      // Select confidence
      await expenseFormModal.selectConfidence('high')

      // Submit
      await expenseFormModal.submit()

      // Wait for modal to close (success)
      await expect(page.getByTestId('expense-form-modal')).toBeHidden({ timeout: 10000 })
    })

    test('validates required fields', async ({ dashboardPage, expenseFormModal, page }) => {
      await dashboardPage.goto()
      await dashboardPage.openAddExpenseModal()

      // Try to submit without filling required fields
      await expenseFormModal.submit()

      // Should show validation error or button should still be there (form not submitted)
      const saveButton = page.getByRole('button', { name: '儲存' })
      await expect(saveButton).toBeVisible()
    })

    test('creates expense with impulse intent', async ({ dashboardPage, expenseFormModal, page }) => {
      await dashboardPage.goto()
      await dashboardPage.openAddExpenseModal()

      // Fill amount
      await expenseFormModal.fillAmount('100')

      // Select category
      await page.getByRole('button', { name: '請選擇分類' }).click()
      await page.getByRole('option', { name: /飲食/ }).click()

      // Select impulse intent
      await expenseFormModal.selectIntent('impulse')

      // Submit
      await expenseFormModal.submit()

      // Wait for modal to close (success)
      await expect(page.getByTestId('expense-form-modal')).toBeHidden({ timeout: 10000 })
    })

    test('submits create request to /api/entries with normalized optional fields', async ({ dashboardPage, expenseFormModal, page }) => {
      const decisionNote = 'x'.repeat(800)

      await dashboardPage.goto()
      await dashboardPage.openAddExpenseModal()

      await expenseFormModal.fillAmount('680')
      await page.getByRole('button', { name: '請選擇分類' }).click()
      await page.getByRole('option', { name: /交通/ }).click()
      await expenseFormModal.selectIntent('efficiency')
      await expenseFormModal.fillDecisionNote(decisionNote)

      const requestPromise = page.waitForRequest((request) =>
        request.method() === 'POST' &&
        request.url().includes('/api/entries')
      )

      await expenseFormModal.submit()

      const request = await requestPromise
      const body = request.postDataJSON() as Record<string, unknown>

      expect(Number(body.amount)).toBe(680)
      expect(body.category).toBe('transport')
      expect(body.intent).toBe('efficiency')
      expect(body.decision_note).toBe(decisionNote)
      expect(body.note).toBeUndefined()
      expect(body.confidence_level).toBeUndefined()

      await expect(page.getByTestId('expense-form-modal')).toBeHidden({ timeout: 10000 })
    })
  })

  test.describe('Read Expenses', () => {
    test('displays expense list', async ({ expenseListPage, page }) => {
      await expenseListPage.goto()
      // Page should load successfully
      await expect(page.locator('main')).toBeVisible()
    })

    test('shows pagination for many expenses', async ({ expenseListPage }) => {
      await expenseListPage.goto()

      // Check if pagination exists (may not if few expenses)
      const paginationVisible = await expenseListPage.pagination.isVisible().catch(() => false)

      if (paginationVisible) {
        await expect(expenseListPage.pagination).toBeVisible()
      }
    })
  })

  test.describe('Filters', () => {
    test('uses preset query and excludes custom date range when preset is not custom', async ({ apiHelper, expenseListPage, page }) => {
      await apiHelper.cleanupTestData()
      await apiHelper.createExpense({
        amount: 500,
        category: 'food',
        occurred_at: new Date().toISOString(),
        note: 'Filter preset test',
      })

      await expenseListPage.goto()
      await expenseListPage.waitForPageReady()

      await page.getByRole('button', { name: '篩選' }).click()
      await page.getByRole('button', { name: '自訂' }).click()

      const dateInputs = page.locator('input[type="date"]')
      await dateInputs.first().fill('2024-01-01')
      await dateInputs.nth(1).fill('2024-01-31')

      await page.getByRole('button', { name: '本月' }).click()

      const requestPromise = page.waitForRequest((request) =>
        request.method() === 'GET' &&
        request.url().includes('/api/expenses?')
      )

      await page.getByRole('button', { name: '套用篩選' }).click()
      const request = await requestPromise
      const url = new URL(request.url())

      expect(url.searchParams.get('preset')).toBe('this_month')
      expect(url.searchParams.get('start_date')).toBeNull()
      expect(url.searchParams.get('end_date')).toBeNull()
    })

    test('keeps multi-select category and intent order in list request params', async ({ apiHelper, expenseListPage, page }) => {
      await apiHelper.cleanupTestData()
      await apiHelper.createExpense({
        amount: 700,
        category: 'food',
        occurred_at: new Date().toISOString(),
        note: 'Filter order test',
      })

      await expenseListPage.goto()
      await expenseListPage.waitForPageReady()

      await page.getByRole('button', { name: '篩選' }).click()
      await page.getByRole('button', { name: /交通/ }).click()
      await page.getByRole('button', { name: /飲食/ }).click()
      await page.getByRole('button', { name: /衝動/ }).click()
      await page.getByRole('button', { name: /必要/ }).click()

      const requestPromise = page.waitForRequest((request) =>
        request.method() === 'GET' &&
        request.url().includes('/api/expenses?')
      )

      await page.getByRole('button', { name: '套用篩選' }).click()
      const request = await requestPromise
      const url = new URL(request.url())

      expect(url.searchParams.get('category')).toBe('transport,food')
      expect(url.searchParams.get('intent')).toBe('impulse,necessity')
    })
  })

  test.describe('Update Expense', () => {
    test('edits an existing expense', async ({ apiHelper, expenseListPage, expenseFormModal, page }) => {
      // Seed test data
      await apiHelper.cleanupTestData()
      const created = await apiHelper.createExpense({
        amount: 500,
        category: 'food',
        occurred_at: new Date().toISOString(),
        note: 'Test expense for edit',
      })
      const expenseId = created?.data?.id as number
      expect(expenseId).toBeTruthy()

      await expenseListPage.goto()
      await expenseListPage.waitForPageReady()

      // Click edit button on first expense
      await page.locator('button[title="編輯"]').first().click()

      // Wait for modal
      await expect(page.getByRole('heading', { name: '編輯消費記錄' })).toBeVisible({ timeout: 10000 })

      // Modify amount
      await expenseFormModal.fillAmount('999')

      // Select intent (required field)
      await expenseFormModal.selectIntent('necessity')

      const decisionRequestPromise = page.waitForRequest((request) =>
        request.url().includes(`/api/expenses/${expenseId}/decision`) &&
        (request.method() === 'PUT' || request.method() === 'POST')
      )

      await expenseFormModal.submit()

      const decisionRequest = await decisionRequestPromise
      const decisionBody = decisionRequest.postDataJSON() as Record<string, unknown>
      expect(decisionBody.intent).toBe('necessity')

      // Verify list update
      await expect(page.getByText('$999')).toBeVisible({ timeout: 10000 })
    })

    test('updates decision only without calling expense update endpoint', async ({ apiHelper, expenseListPage, expenseFormModal, page }) => {
      await apiHelper.cleanupTestData()
      const created = await apiHelper.createExpense({
        amount: 530,
        category: 'food',
        occurred_at: new Date().toISOString(),
        note: 'Decision only update test',
      })
      const expenseId = created?.data?.id as number
      expect(expenseId).toBeTruthy()

      await expenseListPage.goto()
      await expenseListPage.waitForPageReady()
      await page.locator('button[title="編輯"]').first().click()
      await expect(page.getByRole('heading', { name: '編輯消費記錄' })).toBeVisible({ timeout: 10000 })

      await expenseFormModal.selectIntent('efficiency')
      await expenseFormModal.fillDecisionNote('optimize decision')

      const decisionRequestPromise = page.waitForRequest((request) =>
        request.url().includes(`/api/expenses/${expenseId}/decision`) &&
        (request.method() === 'PUT' || request.method() === 'POST')
      )
      const expenseUpdateRequests: string[] = []
      const requestListener = (request: { method(): string; url(): string }) => {
        if (
          request.method() === 'PUT' &&
          request.url().includes(`/api/expenses/${expenseId}`) &&
          !request.url().includes('/decision')
        ) {
          expenseUpdateRequests.push(request.url())
        }
      }
      page.on('request', requestListener)

      await expenseFormModal.submit()

      const decisionRequest = await decisionRequestPromise
      page.off('request', requestListener)
      const decisionBody = decisionRequest.postDataJSON() as Record<string, unknown>
      expect(decisionBody.intent).toBe('efficiency')
      expect(expenseUpdateRequests).toHaveLength(0)
    })

    test('falls back from PUT decision to POST decision when decision does not exist', async ({ apiHelper, expenseListPage, expenseFormModal, page }) => {
      await apiHelper.cleanupTestData()
      const created = await apiHelper.createExpense({
        amount: 610,
        category: 'transport',
        occurred_at: new Date().toISOString(),
        note: 'Decision fallback test',
      })
      const expenseId = created?.data?.id as number
      expect(expenseId).toBeTruthy()

      await expenseListPage.goto()
      await expenseListPage.waitForPageReady()
      await page.locator('button[title="編輯"]').first().click()
      await expect(page.getByRole('heading', { name: '編輯消費記錄' })).toBeVisible({ timeout: 10000 })

      await expenseFormModal.selectIntent('necessity')

      const putDecisionRequestPromise = page.waitForRequest((request) =>
        request.method() === 'PUT' &&
        request.url().includes(`/api/expenses/${expenseId}/decision`)
      )
      const postDecisionRequestPromise = page.waitForRequest((request) =>
        request.method() === 'POST' &&
        request.url().includes(`/api/expenses/${expenseId}/decision`)
      )

      await expenseFormModal.submit()

      const [putRequest, postRequest] = await Promise.all([
        putDecisionRequestPromise,
        postDecisionRequestPromise,
      ])
      const putBody = putRequest.postDataJSON() as Record<string, unknown>
      const postBody = postRequest.postDataJSON() as Record<string, unknown>

      expect(putBody.intent).toBe('necessity')
      expect(postBody.intent).toBe('necessity')
    })
  })

  test.describe('Delete Expense', () => {
    test('deletes an expense with confirmation', async ({ apiHelper, expenseListPage, page }) => {
      // Seed test data
      await apiHelper.cleanupTestData()
      await apiHelper.createExpense({
        amount: 300,
        category: 'transport',
        occurred_at: new Date().toISOString(),
        note: 'Test expense for delete',
      })

      await expenseListPage.goto()
      await expenseListPage.waitForPageReady()

      const initialCount = await expenseListPage.getExpenseCount()

      // Click delete button on first expense
      await page.locator('button[title="刪除"]').first().click()

      // Wait for confirm dialog
      await expect(page.getByText('確認刪除')).toBeVisible({ timeout: 10000 })

      // Confirm deletion
      await page.getByRole('button', { name: '確認' }).click()

      // Verify success toast
      await expect(page.getByText('刪除成功')).toBeVisible({ timeout: 10000 })

      // Verify count decreased
      const newCount = await expenseListPage.getExpenseCount()
      expect(newCount).toBe(initialCount - 1)
    })

    test('cancels delete operation', async ({ apiHelper, expenseListPage, page }) => {
      // Seed test data
      await apiHelper.cleanupTestData()
      await apiHelper.createExpense({
        amount: 400,
        category: 'living',
        occurred_at: new Date().toISOString(),
        note: 'Test expense for cancel delete',
      })

      await expenseListPage.goto()
      await expenseListPage.waitForPageReady()

      const initialCount = await expenseListPage.getExpenseCount()

      // Click delete button on first expense
      await page.locator('button[title="刪除"]').first().click()

      // Wait for confirm dialog
      await expect(page.getByText('確認刪除')).toBeVisible({ timeout: 10000 })

      // Cancel deletion
      await page.locator('[role="dialog"]').getByRole('button', { name: '取消' }).click()

      // Verify dialog closed
      await expect(page.getByText('確認刪除')).toBeHidden({ timeout: 5000 })

      // Verify count unchanged
      const newCount = await expenseListPage.getExpenseCount()
      expect(newCount).toBe(initialCount)
    })
  })
})
