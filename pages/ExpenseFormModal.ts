import { Page, Locator } from '@playwright/test'
import { BasePage } from './BasePage'

export interface ExpenseFormData {
  amount: string
  category?: string
  occurredAt?: string
  intent?: string
  confidenceLevel?: string
  note?: string
  decisionNote?: string
}

/**
 * Expense form modal page object
 */
export class ExpenseFormModal extends BasePage {
  // Form fields
  readonly amountInput: Locator
  readonly categorySelect: Locator
  readonly dateInput: Locator
  readonly noteTextarea: Locator
  readonly decisionNoteTextarea: Locator

  // Intent selector buttons
  readonly intentNecessity: Locator
  readonly intentEfficiency: Locator
  readonly intentEnjoyment: Locator
  readonly intentRecovery: Locator
  readonly intentImpulse: Locator

  // Confidence selector buttons
  readonly confidenceHigh: Locator
  readonly confidenceMedium: Locator
  readonly confidenceLow: Locator

  // Action buttons
  readonly submitButton: Locator
  readonly cancelButton: Locator

  constructor(page: Page) {
    super(page)

    // Form fields
    this.amountInput = page.getByRole('spinbutton', { name: '金額' })
    this.categorySelect = page.getByRole('button', { name: '請選擇分類' })
    this.dateInput = page.getByRole('textbox', { name: '消費日期' })
    this.noteTextarea = page.getByRole('textbox', { name: '備註（選填）', exact: true })
    this.decisionNoteTextarea = page.getByRole('textbox', { name: '決策備註（選填）', exact: true })

    // Intent buttons
    this.intentNecessity = page.getByRole('button', { name: /必要/ })
    this.intentEfficiency = page.getByRole('button', { name: /效率/ })
    this.intentEnjoyment = page.getByRole('button', { name: /享受/ })
    this.intentRecovery = page.getByRole('button', { name: /恢復/ })
    this.intentImpulse = page.getByRole('button', { name: /衝動/ })

    // Confidence buttons
    this.confidenceHigh = page.getByRole('button', { name: /很滿意/ })
    this.confidenceMedium = page.getByRole('button', { name: /還好/ })
    this.confidenceLow = page.getByRole('button', { name: /有點後悔/ })

    // Action buttons
    this.submitButton = page.getByRole('button', { name: /儲存|新增|更新/ })
    this.cancelButton = page.getByRole('button', { name: '取消' })
  }

  async fillAmount(amount: string) {
    await this.amountInput.clear()
    await this.amountInput.fill(amount)
  }

  async selectCategory(category: string) {
    await this.categorySelect.click()
    await this.page.getByRole('option').filter({ hasText: category }).first().click()
  }

  async selectIntent(intent: 'necessity' | 'efficiency' | 'enjoyment' | 'recovery' | 'impulse') {
    const intentMap = {
      necessity: this.intentNecessity,
      efficiency: this.intentEfficiency,
      enjoyment: this.intentEnjoyment,
      recovery: this.intentRecovery,
      impulse: this.intentImpulse,
    }
    await intentMap[intent].click()
  }

  async selectConfidence(level: 'high' | 'medium' | 'low') {
    const confidenceMap = {
      high: this.confidenceHigh,
      medium: this.confidenceMedium,
      low: this.confidenceLow,
    }
    await confidenceMap[level].click()
  }

  async fillNote(note: string) {
    await this.noteTextarea.fill(note)
  }

  async fillDecisionNote(note: string) {
    await this.decisionNoteTextarea.fill(note)
  }

  async fillForm(data: ExpenseFormData) {
    await this.fillAmount(data.amount)

    if (data.category) {
      await this.selectCategory(data.category)
    }

    if (data.intent) {
      await this.selectIntent(data.intent as any)
    }

    if (data.confidenceLevel) {
      await this.selectConfidence(data.confidenceLevel as any)
    }

    if (data.note) {
      await this.fillNote(data.note)
    }

    if (data.decisionNote) {
      await this.fillDecisionNote(data.decisionNote)
    }
  }

  async submit() {
    await this.submitButton.click()
  }

  async cancel() {
    await this.cancelButton.click()
  }
}
