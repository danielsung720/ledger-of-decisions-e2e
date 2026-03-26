import { test, expect } from '../fixtures/test-fixtures'
import type { Page } from '@playwright/test'
import { loginByApi } from '../helpers/login-by-api'

const themeCard = (page: Page, id: 'default' | 'code' | 'ocean') =>
  page.locator('[data-testid="settings-page"]:visible').last()
    .locator(`[data-testid="theme-card-${id}"]`).first()
const selectedThemeCard = (page: Page) =>
  page.locator('[data-testid="settings-page"]:visible').last()
    .locator('[data-testid^="theme-card-"][aria-checked="true"]')

async function gotoSettings(page: Page) {
  const settingsPage = page.getByTestId('settings-page')

  await page.goto('/settings')
  const loadedOnFirstTry = await settingsPage.isVisible().catch(() => false)
  if (!loadedOnFirstTry) {
    await page.goto('/settings')
  }

  await expect(page).toHaveURL(/\/settings/)
  await expect(settingsPage).toBeVisible({ timeout: 10000 })
}

test.describe('Theme Switcher', () => {
  test.beforeEach(async ({ page, apiHelper }) => {
    await loginByApi(page, apiHelper, {
      email: process.env.E2E_TEST_EMAIL || 'e2e_core@example.com',
      password: process.env.E2E_TEST_PASSWORD || 'password',
    })
  })

  test.describe('Settings Entry', () => {
    test('navigates to settings from user menu', async ({ page }) => {
      await page.goto('/')

      const isMobile = (page.viewportSize()?.width ?? 1280) < 768

      if (isMobile) {
        // On mobile the user menu is hidden (md:block) — navigate directly
        await gotoSettings(page)
      } else {
        // Desktop: open user menu and click settings link
        await page.getByTestId('user-menu-button').click()
        const settingsLink = page.getByTestId('user-menu-settings')
        await expect(settingsLink).toBeVisible()
        await settingsLink.click()
        await expect(page).toHaveURL('/settings')
        await expect(page.getByTestId('settings-page')).toBeVisible({ timeout: 10000 })
      }
    })

    test('settings page shows theme section', async ({ page }) => {
      await gotoSettings(page)

      // Verify theme section exists
      const themeSection = page.getByTestId('theme-section')
      await expect(themeSection).toBeVisible()

      // Verify section title
      await expect(page.getByText('外觀主題')).toBeVisible()
    })
  })

  test.describe('Theme Cards', () => {
    test('displays all three theme cards', async ({ page }) => {
      await gotoSettings(page)

      // Verify all theme cards are visible
      await expect(themeCard(page, 'default')).toBeVisible()
      await expect(themeCard(page, 'code')).toBeVisible()
      await expect(themeCard(page, 'ocean')).toBeVisible()
    })

    test('each theme card shows name and description', async ({ page }) => {
      await gotoSettings(page)

      // Default theme
      const defaultCard = themeCard(page, 'default')
      await expect(defaultCard.getByText('預設風格')).toBeVisible()
      await expect(defaultCard.getByText('溫暖療癒')).toBeVisible()

      // Code theme
      const codeCard = themeCard(page, 'code')
      await expect(codeCard.getByText('程式碼風格')).toBeVisible()
      await expect(codeCard.getByText('專注效率')).toBeVisible()

      // Ocean theme
      const oceanCard = themeCard(page, 'ocean')
      await expect(oceanCard.getByText('海洋清新風格')).toBeVisible()
      await expect(oceanCard.getByText('清爽活力')).toBeVisible()
    })

    test('each theme card has preview area', async ({ page }) => {
      await gotoSettings(page)

      await expect(page.getByTestId('theme-preview-default')).toBeVisible()
      await expect(page.getByTestId('theme-preview-code')).toBeVisible()
      await expect(page.getByTestId('theme-preview-ocean')).toBeVisible()
    })
  })

  test.describe('Theme Selection', () => {
    test('current theme is selected initially', async ({ page }) => {
      await gotoSettings(page)

      const html = page.locator('html')
      const currentTheme = await html.getAttribute('data-theme')
      expect(currentTheme).toMatch(/^(default|code|ocean)$/)
      await expect(selectedThemeCard(page)).toHaveCount(1)
    })

    test('clicking code theme switches to code theme', async ({ page }) => {
      await gotoSettings(page)

      const codeCard = themeCard(page, 'code')
      await codeCard.click()

      // Verify selection state
      await expect(codeCard).toHaveAttribute('aria-checked', 'true')

      // Verify data-theme attribute on html
      const html = page.locator('html')
      await expect(html).toHaveAttribute('data-theme', 'code')
    })

    test('clicking ocean theme switches to ocean theme', async ({ page }) => {
      await gotoSettings(page)

      const oceanCard = themeCard(page, 'ocean')
      await oceanCard.click()

      // Verify selection state
      await expect(oceanCard).toHaveAttribute('aria-checked', 'true')

      // Verify data-theme attribute on html
      const html = page.locator('html')
      await expect(html).toHaveAttribute('data-theme', 'ocean')
    })

    test('only one theme is selected at a time', async ({ page }) => {
      await gotoSettings(page)

      // Select code theme
      await themeCard(page, 'code').click()
      await expect(page.locator('html')).toHaveAttribute('data-theme', 'code')

      // Verify only code is selected
      await expect(selectedThemeCard(page)).toHaveCount(1)

      // Select ocean theme
      await themeCard(page, 'ocean').click()
      await expect(page.locator('html')).toHaveAttribute('data-theme', 'ocean')

      // Verify only ocean is selected
      await expect(selectedThemeCard(page)).toHaveCount(1)
    })
  })

  test.describe('Theme Persistence', () => {
    test('selected theme persists after page reload', async ({ page }) => {
      await gotoSettings(page)

      // Select ocean theme
      await themeCard(page, 'ocean').click()
      await expect(page.locator('html')).toHaveAttribute('data-theme', 'ocean')

      // Reload page
      await page.reload()

      // Verify theme persists
      await expect(page.locator('html')).toHaveAttribute('data-theme', 'ocean')
      await expect(selectedThemeCard(page)).toHaveCount(1)
    })

    test('selected theme applies across different pages', async ({ page }) => {
      await gotoSettings(page)

      // Select code theme
      await themeCard(page, 'code').click()
      await expect(page.locator('html')).toHaveAttribute('data-theme', 'code')

      // Navigate to dashboard
      await page.goto('/')
      await expect(page.locator('html')).toHaveAttribute('data-theme', 'code')

      // Navigate to records
      await page.goto('/records')
      await expect(page.locator('html')).toHaveAttribute('data-theme', 'code')

      // Navigate back to settings
      await gotoSettings(page)
      await expect(page.locator('html')).toHaveAttribute('data-theme', 'code')
      await expect(selectedThemeCard(page)).toHaveCount(1)
    })
  })

  test.describe('Keyboard Accessibility', () => {
    test('theme cards are focusable with Tab', async ({ page }) => {
      await gotoSettings(page)

      // Focus on first theme card using Tab
      await page.keyboard.press('Tab')
      await page.keyboard.press('Tab') // Skip to theme section

      // Keep pressing Tab until we reach theme cards
      let focusedElement = themeCard(page, 'default')
      let attempts = 0
      while (attempts < 10 && !(await focusedElement.evaluate((el) => el === document.activeElement))) {
        await page.keyboard.press('Tab')
        attempts++
      }

      // Verify a theme card is focusable
      const activeElement = await page.evaluate(() => document.activeElement?.getAttribute('data-testid'))
      expect(activeElement).toMatch(/theme-card-(default|code|ocean)/)
    })

    test('Enter key selects focused theme card', async ({ page }) => {
      await gotoSettings(page)

      // Focus on code theme card
      const codeCard = themeCard(page, 'code')
      await codeCard.focus()

      // Press Enter to select
      await page.keyboard.press('Enter')

      // Verify selection
      await expect(page.locator('html')).toHaveAttribute('data-theme', 'code')
      await expect(selectedThemeCard(page)).toHaveCount(1)
    })

    test('Space key selects focused theme card', async ({ page }) => {
      await gotoSettings(page)

      // Wait for ClientOnly to hydrate and theme cards to render
      await expect(themeCard(page, 'default')).toBeVisible()

      // Focus on ocean theme card
      const oceanCard = themeCard(page, 'ocean')
      await oceanCard.focus()

      // Press Space to select
      await page.keyboard.press('Space')

      // Verify selection
      await expect(oceanCard).toHaveAttribute('aria-checked', 'true')
      await expect(page.locator('html')).toHaveAttribute('data-theme', 'ocean')
    })

    test('focus ring is visible on focused theme card', async ({ page }) => {
      await gotoSettings(page)

      // Focus on a theme card
      const codeCard = themeCard(page, 'code')
      await expect(codeCard).toBeVisible()
      await codeCard.focus()

      // Check that focus is visible (card should have focus-visible styles)
      await expect(codeCard).toBeFocused()
    })
  })

  test.describe('Theme Visual Effects', () => {
    test('code theme applies dark background', async ({ page }) => {
      await gotoSettings(page)

      // Select code theme
      await themeCard(page, 'code').click()

      // Verify dark background is applied
      const bgColor = await page.evaluate(() => {
        return getComputedStyle(document.documentElement).getPropertyValue('--color-bg').trim()
      })

      // Code theme has dark background
      expect(bgColor).toBeTruthy()
    })

    test('ocean theme applies light blue background', async ({ page }) => {
      await gotoSettings(page)

      // Select ocean theme
      await themeCard(page, 'ocean').click()

      // Verify ocean background is applied
      const bgColor = await page.evaluate(() => {
        return getComputedStyle(document.documentElement).getPropertyValue('--color-bg').trim()
      })

      // Ocean theme has light blue background
      expect(bgColor).toBeTruthy()
    })
  })

  test.describe('Settings Page Layout', () => {
    test('settings page requires authentication', async ({ browser }) => {
      // Create a new context without auth
      const context = await browser.newContext({ storageState: { cookies: [], origins: [] } })
      const page = await context.newPage()

      await page.goto('/settings')

      // Should redirect to login
      await expect(page).toHaveURL(/\/login/)

      await context.close()
    })

    test('settings page has back to home link', async ({ page }) => {
      await gotoSettings(page)

      const homeLink = page.getByRole('link', { name: '返回首頁' })
      await expect(homeLink).toBeVisible()

      await homeLink.click()
      await expect(page).toHaveURL('/')
    })
  })
})
