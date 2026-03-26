import { expect, type Page } from '@playwright/test'
import type { ApiHelper } from './api'
import { getTestCredentials } from './test-auth'

type Credentials = {
  email: string
  password: string
}

export async function loginByApi(page: Page, apiHelper: ApiHelper, credentials?: Credentials) {
  const { email, password } = credentials ?? getTestCredentials()
  const frontendOrigin = new URL(process.env.BASE_URL || 'http://localhost:3001').origin

  const apiLoginResult = await apiHelper.login(email, password)
  expect(apiLoginResult.ok).toBe(true)

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

  const pageLoginResponse = await page.request.post('/api/login', {
    data: { email, password },
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-XSRF-TOKEN': decodeURIComponent(xsrfCookie!.value),
      Origin: frontendOrigin,
      Referer: `${frontendOrigin}/`,
    },
  })
  expect(pageLoginResponse.ok()).toBe(true)

  const userProbe = await page.request.get('/api/user', {
    headers: {
      Accept: 'application/json',
      Origin: frontendOrigin,
      Referer: `${frontendOrigin}/`,
    },
  })
  expect(userProbe.ok()).toBe(true)

  await page.goto('/')
  // Wait for Nuxt's auth middleware to settle: both elements use v-if="isAuthenticated"
  // so they only appear in the DOM once the auth state is confirmed in the Vue app.
  // Using 'attached' (not 'visible') so this works on both desktop and mobile viewports.
  await page
    .getByTestId('mobile-add-expense-button')
    .waitFor({ state: 'attached', timeout: 15000 })
}
