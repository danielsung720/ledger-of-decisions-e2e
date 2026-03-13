import fs from 'fs'
import path from 'path'
import { test as setup, expect } from '@playwright/test'

const authFile = path.resolve(__dirname, '../../playwright/.auth/user.json')

setup('authenticate', async ({ page, request }) => {
  const email = process.env.E2E_TEST_EMAIL || 'e2e_core@example.com'
  const password = process.env.E2E_TEST_PASSWORD || 'password'

  const loginResponse = await request.post('/api/login', {
    data: { email, password },
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
  })

  expect(loginResponse.ok()).toBe(true)
  const loginPayload = await loginResponse.json()
  const token = loginPayload?.data?.token as string | undefined
  expect(token).toBeTruthy()

  fs.mkdirSync(path.dirname(authFile), { recursive: true })

  await page.goto('/login')
  await page.evaluate((value) => {
    localStorage.setItem('auth_token', value)
  }, token!)

  await page.context().storageState({ path: authFile })
})
