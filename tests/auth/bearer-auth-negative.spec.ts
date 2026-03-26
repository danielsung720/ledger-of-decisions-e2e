import { test, expect } from '../../fixtures/test-fixtures'

const emptyStorageState = { cookies: [], origins: [] }
test.use({ storageState: emptyStorageState })

test.describe('Bearer Auth Negative', () => {
  test('rejects bearer header and does not create authenticated session state', async ({ page }) => {
    const frontendOrigin = new URL(process.env.BASE_URL || 'http://localhost:3001').origin

    const bearerProbe = await page.request.get('/api/user', {
      headers: {
        Accept: 'application/json',
        Authorization: 'Bearer legacy_token',
        Origin: frontendOrigin,
        Referer: `${frontendOrigin}/`,
      },
    })

    expect(bearerProbe.status()).toBe(401)

    const noBearerProbe = await page.request.get('/api/user', {
      headers: {
        Accept: 'application/json',
        Origin: frontendOrigin,
        Referer: `${frontendOrigin}/`,
      },
    })

    expect(noBearerProbe.status()).toBe(401)

    await page.goto('/review')
    await page.waitForURL('/login', { timeout: 5000 })
    await expect(page).toHaveURL('/login')
  })
})
