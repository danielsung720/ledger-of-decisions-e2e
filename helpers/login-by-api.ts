import { expect, type Page } from '@playwright/test'
import type { ApiHelper } from './api'
import { getTestCredentials } from './test-auth'

type Credentials = {
  email: string
  password: string
}

export async function loginByApi(page: Page, apiHelper: ApiHelper, credentials?: Credentials) {
  const { email, password } = credentials ?? getTestCredentials()
  const loginResult = await apiHelper.login(email, password)
  expect(loginResult.ok).toBe(true)

  const token = loginResult.data?.data?.token as string | undefined
  expect(token).toBeTruthy()

  await page.goto('/login')
  await page.evaluate((value) => {
    localStorage.setItem('auth_token', value)
  }, token!)
}
