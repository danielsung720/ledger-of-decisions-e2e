import fs from 'fs'
import path from 'path'
import { test as setup, expect } from '@playwright/test'

const browserName = process.env.E2E_BROWSER || 'user'
const authFile = path.resolve(__dirname, `../../playwright/.auth/${browserName}.json`)

setup('authenticate', async ({ page }) => {
  const email = process.env.E2E_TEST_EMAIL || 'e2e_core@example.com'
  const password = process.env.E2E_TEST_PASSWORD || 'password'
  const frontendOrigin = new URL(process.env.BASE_URL || 'http://localhost:3001').origin

  const csrfResponse = await page.request.get('/sanctum/csrf-cookie', {
    headers: {
      Accept: 'application/json',
      Origin: frontendOrigin,
      Referer: `${frontendOrigin}/`,
    },
  })
  expect(csrfResponse.ok()).toBe(true)

  const xsrfCookie = (await page.context().cookies()).find((cookie) => cookie.name === 'XSRF-TOKEN')
  expect(xsrfCookie).toBeTruthy()

  const loginResponse = await page.request.post('/api/login', {
    data: { email, password },
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'X-XSRF-TOKEN': decodeURIComponent(xsrfCookie!.value),
      Origin: frontendOrigin,
      Referer: `${frontendOrigin}/`,
    },
  })

  expect(loginResponse.ok()).toBe(true)

  fs.mkdirSync(path.dirname(authFile), { recursive: true })
  const userProbe = await page.request.get('/api/user', {
    headers: {
      Accept: 'application/json',
      Origin: frontendOrigin,
      Referer: `${frontendOrigin}/`,
    },
  })
  expect(userProbe.ok()).toBe(true)

  await page.context().storageState({ path: authFile })
})
