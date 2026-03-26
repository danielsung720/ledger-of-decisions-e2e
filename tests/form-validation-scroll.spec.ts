import { test, expect } from '../fixtures/test-fixtures'
import type { Page } from '@playwright/test'
import { loginByApi } from '../helpers/login-by-api'

type ErrorFieldName =
  | 'amount'
  | 'category'
  | 'occurred_at'
  | 'note'
  | 'intent'
  | 'confidence_level'
  | 'decision_note'

function getErrorField(page: Page, fieldName: ErrorFieldName) {
  return page.locator(`[data-error-field="${fieldName}"]`)
}

test.describe('Form Validation Scroll to Error', () => {
  test.describe.configure({ mode: 'serial' })

  test.beforeEach(async ({ page, apiHelper }) => {
    await loginByApi(page, apiHelper, {
      email: process.env.E2E_EXPENSE_CRUD_EMAIL || 'expense_crud@example.com',
      password: process.env.E2E_EXPENSE_CRUD_PASSWORD || 'password',
    })
  })

  test('TC-01: amount missing should scroll to amount and focus input', async ({
    dashboardPage,
    expenseFormModal,
    page,
  }) => {
    await dashboardPage.goto()
    await dashboardPage.openAddExpenseModal()

    await expenseFormModal.submit()

    const amountField = getErrorField(page, 'amount')
    await expect(amountField).toHaveAttribute('aria-invalid', 'true')
    await expect(amountField).toBeInViewport()
    await expect(expenseFormModal.amountInput).toBeFocused()
    await expect(page.getByTestId('expense-form-modal')).toBeVisible()
  })

  test('TC-02: multiple required errors should still focus first DOM error field (amount)', async ({
    dashboardPage,
    expenseFormModal,
    page,
  }) => {
    await dashboardPage.goto()
    await dashboardPage.openAddExpenseModal()

    await expenseFormModal.submit()

    await expect(getErrorField(page, 'amount')).toHaveAttribute('aria-invalid', 'true')
    await expect(getErrorField(page, 'category')).toHaveAttribute('aria-invalid', 'true')
    await expect(getErrorField(page, 'intent')).toHaveAttribute('aria-invalid', 'true')
    await expect(expenseFormModal.amountInput).toBeFocused()
  })

  test('TC-03: category-only error should scroll to category field', async ({
    dashboardPage,
    expenseFormModal,
    page,
  }) => {
    await dashboardPage.goto()
    await dashboardPage.openAddExpenseModal()

    await expenseFormModal.fillAmount('500')
    await expenseFormModal.selectIntent('necessity')
    await expenseFormModal.submit()

    await expect(getErrorField(page, 'category')).toHaveAttribute('aria-invalid', 'true')
    await expect(getErrorField(page, 'amount')).toHaveAttribute('aria-invalid', 'false')
    await expect(getErrorField(page, 'category')).toBeInViewport()
  })

  test('TC-04: intent-only error should scroll to intent and focus fallback element', async ({
    dashboardPage,
    expenseFormModal,
    page,
  }) => {
    await dashboardPage.goto()
    await dashboardPage.openAddExpenseModal()

    await expenseFormModal.fillAmount('500')
    await expenseFormModal.selectCategory('飲食')
    await expenseFormModal.submit()

    const intentField = getErrorField(page, 'intent')
    await expect(intentField).toHaveAttribute('aria-invalid', 'true')
    await expect(intentField).toBeInViewport()

    const activeFieldName = await page.evaluate(() => {
      const active = document.activeElement
      if (!active) return null
      const container = active.closest('[data-error-field]') as HTMLElement | null
      return container?.getAttribute('data-error-field') ?? null
    })
    expect(activeFieldName).toBe('intent')
  })

  test('TC-05: valid form submit should close modal and keep amount aria-invalid false', async ({
    dashboardPage,
    expenseFormModal,
    page,
  }) => {
    await dashboardPage.goto()
    await dashboardPage.openAddExpenseModal()

    await expenseFormModal.fillAmount('300')
    await expenseFormModal.selectCategory('飲食')
    await expenseFormModal.selectIntent('necessity')

    await expect(getErrorField(page, 'amount')).toHaveAttribute('aria-invalid', 'false')
    await expenseFormModal.submit()

    await expect(page.getByTestId('expense-form-modal')).toBeHidden({ timeout: 10000 })
  })

  test.describe('TC-06: desktop viewport (1280x800)', () => {
    test.use({ viewport: { width: 1280, height: 800 } })

    test('desktop submit invalid should keep amount in viewport', async ({
      dashboardPage,
      expenseFormModal,
      page,
    }) => {
      await dashboardPage.goto()
      await dashboardPage.openAddExpenseModal()

      await expenseFormModal.submit()

      await expect(getErrorField(page, 'amount')).toHaveAttribute('aria-invalid', 'true')
      await expect(getErrorField(page, 'amount')).toBeInViewport()
    })
  })

  test.describe('TC-07: mobile viewport (375x812)', () => {
    test.use({ viewport: { width: 375, height: 812 } })

    test('mobile bottom interaction then submit should scroll back to amount error', async ({
      dashboardPage,
      expenseFormModal,
      page,
    }) => {
      await dashboardPage.goto()
      await dashboardPage.openAddExpenseModal()

      await expenseFormModal.fillDecisionNote('simulate bottom interaction')

      const modalScrollContainer = page.locator('div.fixed.inset-0.overflow-y-auto').first()
      await modalScrollContainer.evaluate((el) => {
        el.scrollTop = el.scrollHeight
      })

      await expenseFormModal.submit()

      await expect(getErrorField(page, 'amount')).toHaveAttribute('aria-invalid', 'true')
      await expect(getErrorField(page, 'amount')).toBeInViewport()
    })
  })

  test('TC-08: validation error message stays unchanged and no console error', async ({
    dashboardPage,
    expenseFormModal,
    page,
  }) => {
    const consoleErrors: string[] = []
    page.on('console', (message) => {
      if (message.type() === 'error') {
        consoleErrors.push(message.text())
      }
    })

    await dashboardPage.goto()
    await dashboardPage.openAddExpenseModal()

    await expenseFormModal.submit()

    const amountField = getErrorField(page, 'amount')
    await expect(amountField).toHaveAttribute('aria-invalid', 'true')
    await expect(amountField.locator('p').first()).toHaveText('金額必須大於 0')
    expect(consoleErrors).toEqual([])
  })
})
