import { APIRequestContext } from '@playwright/test'

// Uses 8081 to avoid conflict with dev environment (8080)
const API_BASE = process.env.API_URL || 'http://localhost:8081/api'
const API_ORIGIN = new URL(API_BASE).origin
const FRONTEND_ORIGIN = new URL(process.env.BASE_URL || 'http://localhost:3001').origin
const CSRF_COOKIE_URL = `${API_ORIGIN}/sanctum/csrf-cookie`
const XSRF_COOKIE_NAME = 'XSRF-TOKEN'
const XSRF_HEADER_NAME = 'X-XSRF-TOKEN'
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

interface User {
  id: number
  name: string
  email: string
}

/**
 * API helper for test data setup and teardown
 */
export class ApiHelper {
  private request: APIRequestContext
  private csrfToken: string | null = null

  constructor(request: APIRequestContext) {
    this.request = request
  }

  /**
   * Keep CSRF cookie/header in sync for session-based auth flow.
   */
  private async refreshCsrfTokenFromCookies() {
    const state = await this.request.storageState()
    const cookie = state.cookies.find((item) => item.name === XSRF_COOKIE_NAME)
    this.csrfToken = cookie ? decodeURIComponent(cookie.value) : null
  }

  private isUnsafeMethod(method: HttpMethod): boolean {
    return method === 'POST' || method === 'PUT' || method === 'PATCH' || method === 'DELETE'
  }

  private async ensureCsrfToken() {
    if (this.csrfToken) return

    await this.request.get(CSRF_COOKIE_URL, {
      headers: {
        Accept: 'application/json',
      },
    })
    await this.refreshCsrfTokenFromCookies()
  }

  private async getHeaders(method: HttpMethod) {
    const headers: Record<string, string> = {
      Accept: 'application/json',
      Origin: FRONTEND_ORIGIN,
      Referer: `${FRONTEND_ORIGIN}/`,
    }

    if (method !== 'GET') {
      headers['Content-Type'] = 'application/json'
    }

    if (this.isUnsafeMethod(method)) {
      await this.ensureCsrfToken()
      if (this.csrfToken) {
        headers[XSRF_HEADER_NAME] = this.csrfToken
      }
    }

    return headers
  }

  // ===== Auth API =====

  /**
   * Register a new user
   */
  async register(data: {
    name: string
    email: string
    password: string
    password_confirmation: string
  }) {
    const response = await this.request.post(`${API_BASE}/register`, {
      headers: await this.getHeaders('POST'),
      data,
    })

    return {
      ok: response.ok(),
      status: response.status(),
      data: await response.json().catch(() => null),
    }
  }

  /**
   * Verify email with code
   */
  async verifyEmail(email: string, code: string) {
    const response = await this.request.post(`${API_BASE}/verify-email`, {
      headers: await this.getHeaders('POST'),
      data: { email, code },
    })

    const json = await response.json().catch(() => null)
    await this.refreshCsrfTokenFromCookies()

    return {
      ok: response.ok(),
      status: response.status(),
      data: json,
    }
  }

  /**
   * Login user
   */
  async login(email: string, password: string) {
    const response = await this.request.post(`${API_BASE}/login`, {
      headers: await this.getHeaders('POST'),
      data: { email, password },
    })

    const json = await response.json().catch(() => null)
    await this.refreshCsrfTokenFromCookies()

    return {
      ok: response.ok(),
      status: response.status(),
      data: json,
    }
  }

  /**
   * Logout user
   */
  async logout() {
    const response = await this.request.post(`${API_BASE}/logout`, {
      headers: await this.getHeaders('POST'),
    })

    this.csrfToken = null

    return {
      ok: response.ok(),
      status: response.status(),
    }
  }

  /**
   * Get current user
   */
  async getCurrentUser() {
    const response = await this.request.get(`${API_BASE}/user`, {
      headers: await this.getHeaders('GET'),
    })

    return {
      ok: response.ok(),
      status: response.status(),
      data: await response.json().catch(() => null),
    }
  }

  /**
   * Resend verification code
   */
  async resendVerification(email: string) {
    const response = await this.request.post(`${API_BASE}/resend-verification`, {
      headers: await this.getHeaders('POST'),
      data: { email },
    })

    return {
      ok: response.ok(),
      status: response.status(),
      data: await response.json().catch(() => null),
    }
  }

  /**
   * Request password reset
   */
  async forgotPassword(email: string) {
    const response = await this.request.post(`${API_BASE}/forgot-password`, {
      headers: await this.getHeaders('POST'),
      data: { email },
    })

    return {
      ok: response.ok(),
      status: response.status(),
      data: await response.json().catch(() => null),
    }
  }

  /**
   * Reset password with code
   */
  async resetPassword(data: {
    email: string
    code: string
    password: string
    password_confirmation: string
  }) {
    const response = await this.request.post(`${API_BASE}/reset-password`, {
      headers: await this.getHeaders('POST'),
      data,
    })

    return {
      ok: response.ok(),
      status: response.status(),
      data: await response.json().catch(() => null),
    }
  }

  /**
   * Create a test user (register + auto-verify for testing)
   * Note: This requires backend to support test mode or direct DB manipulation
   */
  async createTestUser(data: {
    name: string
    email: string
    password: string
  }): Promise<{ user: User } | null> {
    // Register
    const registerResult = await this.register({
      ...data,
      password_confirmation: data.password,
    })

    if (!registerResult.ok) {
      return null
    }

    // In test environment, we may need to use a known verification code
    // or the backend should auto-verify in test mode
    // For now, return null as verification requires email
    return null
  }

  /**
   * Generate unique test email
   */
  generateTestEmail(): string {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(7)
    return `test_${timestamp}_${random}@example.com`
  }

  /**
   * Create an expense via API (without decision)
   */
  async createExpense(data: {
    amount: number
    category: string
    occurred_at: string
    note?: string
  }) {
    const payload = {
      amount: data.amount,
      currency: 'TWD',
      category: data.category,
      occurred_at: data.occurred_at,
      note: data.note || null,
    }

    const response = await this.request.post(`${API_BASE}/expenses`, {
      headers: await this.getHeaders('POST'),
      data: payload,
    })

    if (!response.ok()) {
      const text = await response.text()
      throw new Error(`Failed to create expense: ${response.status()} - ${text.substring(0, 200)}`)
    }

    return response.json()
  }

  /**
   * Delete an expense via API
   */
  async deleteExpense(id: number) {
    const response = await this.request.delete(`${API_BASE}/expenses/${id}`, {
      headers: await this.getHeaders('DELETE'),
    })
    if (!response.ok()) {
      console.warn(`Failed to delete expense ${id}: ${response.status()}`)
    }
  }

  /**
   * Get all expenses via API
   */
  async getExpenses() {
    const response = await this.request.get(`${API_BASE}/expenses`, {
      headers: await this.getHeaders('GET'),
    })
    return response.json()
  }

  /**
   * Clean up all test data
   */
  async cleanupTestData() {
    const expenses = await this.getExpenses()
    if (expenses.data) {
      for (const expense of expenses.data) {
        await this.deleteExpense(expense.id)
      }
    }
  }

  /**
   * Get all recurring expenses via API
   */
  async getRecurringExpenses() {
    const response = await this.request.get(`${API_BASE}/recurring-expenses`, {
      headers: await this.getHeaders('GET'),
    })
    return response.json()
  }

  /**
   * Delete a recurring expense via API
   */
  async deleteRecurringExpense(id: number) {
    const response = await this.request.delete(`${API_BASE}/recurring-expenses/${id}`, {
      headers: await this.getHeaders('DELETE'),
    })
    if (!response.ok()) {
      console.warn(`Failed to delete recurring expense ${id}: ${response.status()}`)
    }
  }

  /**
   * Clean up all recurring test data
   */
  async cleanupRecurringTestData() {
    const recurring = await this.getRecurringExpenses()
    if (recurring.data) {
      for (const item of recurring.data) {
        await this.deleteRecurringExpense(item.id)
      }
    }
  }

  /**
   * Create recurring expense via API
   */
  async createRecurringExpense(data: {
    name: string
    amount_min: number
    category: string
    frequency_type: string
    start_date: string
  }) {
    const response = await this.request.post(`${API_BASE}/recurring-expenses`, {
      headers: await this.getHeaders('POST'),
      data: {
        ...data,
        currency: 'TWD',
        frequency_interval: 1,
      },
    })

    return response.json()
  }

  /**
   * Seed test data for review page testing
   */
  async seedReviewTestData() {
    const now = new Date()
    const expenses = [
      { amount: 500, category: 'food' },
      { amount: 1200, category: 'transport' },
      { amount: 300, category: 'food' },
      { amount: 2000, category: 'living' },
      { amount: 150, category: 'other' },
    ]

    for (const expense of expenses) {
      await this.createExpense({
        ...expense,
        occurred_at: now.toISOString(),
      })
    }
  }

  /**
   * Batch delete expenses via API
   */
  async batchDeleteExpenses(ids: number[]) {
    const response = await this.request.delete(`${API_BASE}/expenses/batch`, {
      headers: await this.getHeaders('DELETE'),
      data: { ids },
    })
    return response.json()
  }

  /**
   * Seed test data for batch delete testing
   * Returns array of created expense IDs
   */
  async seedBatchDeleteTestData(count: number = 5): Promise<number[]> {
    const now = new Date()
    const categories = ['food', 'transport', 'training', 'living', 'other']
    const ids: number[] = []

    for (let i = 0; i < count; i++) {
      const result = await this.createExpense({
        amount: (i + 1) * 100,
        category: categories[i % categories.length],
        occurred_at: now.toISOString(),
        note: `Test expense ${i + 1}`,
      })
      if (result.data?.id) {
        ids.push(result.data.id)
      }
    }

    return ids
  }

  /**
   * Create multiple expenses at once for testing
   */
  async createMultipleExpenses(expenses: Array<{
    amount: number
    category: string
    occurred_at: string
    note?: string
  }>): Promise<number[]> {
    const ids: number[] = []

    for (const expense of expenses) {
      const result = await this.createExpense(expense)
      if (result.data?.id) {
        ids.push(result.data.id)
      }
    }

    return ids
  }
}
