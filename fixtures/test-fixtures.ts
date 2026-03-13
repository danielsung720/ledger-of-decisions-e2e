import { test as base, expect } from '@playwright/test'
import {
  DashboardPage,
  ExpenseListPage,
  ExpenseFormModal,
  ReviewPage,
  LoginPage,
  RegisterPage,
  VerifyEmailPage,
  ForgotPasswordPage,
  ResetPasswordPage,
} from '../pages'
import { ApiHelper } from '../helpers/api'

/**
 * Custom test fixtures for E2E tests
 */
type TestFixtures = {
  dashboardPage: DashboardPage
  expenseListPage: ExpenseListPage
  expenseFormModal: ExpenseFormModal
  reviewPage: ReviewPage
  loginPage: LoginPage
  registerPage: RegisterPage
  verifyEmailPage: VerifyEmailPage
  forgotPasswordPage: ForgotPasswordPage
  resetPasswordPage: ResetPasswordPage
  apiHelper: ApiHelper
}

export const test = base.extend<TestFixtures>({
  dashboardPage: async ({ page }, use) => {
    const dashboardPage = new DashboardPage(page)
    await use(dashboardPage)
  },

  expenseListPage: async ({ page }, use) => {
    const expenseListPage = new ExpenseListPage(page)
    await use(expenseListPage)
  },

  expenseFormModal: async ({ page }, use) => {
    const expenseFormModal = new ExpenseFormModal(page)
    await use(expenseFormModal)
  },

  reviewPage: async ({ page }, use) => {
    const reviewPage = new ReviewPage(page)
    await use(reviewPage)
  },

  loginPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page)
    await use(loginPage)
  },

  registerPage: async ({ page }, use) => {
    const registerPage = new RegisterPage(page)
    await use(registerPage)
  },

  verifyEmailPage: async ({ page }, use) => {
    const verifyEmailPage = new VerifyEmailPage(page)
    await use(verifyEmailPage)
  },

  forgotPasswordPage: async ({ page }, use) => {
    const forgotPasswordPage = new ForgotPasswordPage(page)
    await use(forgotPasswordPage)
  },

  resetPasswordPage: async ({ page }, use) => {
    const resetPasswordPage = new ResetPasswordPage(page)
    await use(resetPasswordPage)
  },

  apiHelper: async ({ request }, use) => {
    const apiHelper = new ApiHelper(request)
    await use(apiHelper)
  },
})

export { expect }
