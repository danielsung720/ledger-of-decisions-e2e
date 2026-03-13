import { expect, type Page } from '@playwright/test'
import { getTestCredentials } from './test-auth'

type Credentials = {
  email: string
  password: string
}

export async function loginByUi(page: Page, credentials?: Credentials) {
  const { email, password } = credentials ?? getTestCredentials()

  await page.goto('/login')
  await page.getByPlaceholder('請輸入您的 Email').fill(email)
  await page.getByPlaceholder('請輸入您的密碼').fill(password)
  await page.getByRole('button', { name: '登入' }).click()
  await expect(page).toHaveURL('/')
}
