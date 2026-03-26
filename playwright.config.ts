import { defineConfig, devices } from '@playwright/test'
import path from 'path'

// When running parallel browsers, E2E_BROWSER is set per container.
// Falls back to 'user' (user.json) for normal sequential runs.
const browserName = process.env.E2E_BROWSER || 'user'
const authFile = path.join(__dirname, `playwright/.auth/${browserName}.json`)

/**
 * Playwright configuration for Ledger of Decisions E2E tests
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests',

  // Run files in parallel, but keep tests in the same file sequential by default.
  fullyParallel: false,

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // 3 retries in CI: Firefox/webkit are 30-50% slower in Docker under parallel load;
  // 4 total attempts handle the long tail of infrastructure-driven flakiness
  retries: process.env.CI ? 3 : 0,

  // Opt out of parallel tests on CI
  workers: process.env.CI ? 1 : undefined,

  // Reporter to use
  reporter: process.env.SHARD_REPORT
    ? [
        ['blob', { outputDir: 'blob-reports' }],
        ['list'],
      ]
    : [
        ['html', { outputFolder: 'playwright-report' }],
        ['json', { outputFile: 'test-results/results.json' }],
        ['list'],
      ],

  // Shared settings for all projects
  use: {
    // Base URL for all tests
    // Uses 3001 to avoid conflict with dev environment (3000)
    baseURL: process.env.BASE_URL || 'http://localhost:3001',

    // Collect trace when retrying the failed test
    trace: 'on-first-retry',

    // Capture screenshot on failure
    screenshot: 'only-on-failure',

    // Record video on failure
    video: 'on-first-retry',

    // Default viewport
    viewport: { width: 1280, height: 720 },

    // Default timeout for actions
    actionTimeout: 10000,

    // Default navigation timeout
    navigationTimeout: 30000,
  },

  // Configure projects for major browsers
  projects: [
    {
      name: 'setup',
      testMatch: /tests\/setup\/auth\.setup\.ts/,
    },
    {
      name: 'chromium',
      testIgnore: /tests\/setup\/.*/,
      use: { ...devices['Desktop Chrome'], storageState: authFile },
      dependencies: ['setup'],
    },
    {
      name: 'firefox',
      testIgnore: /tests\/setup\/.*/,
      use: { ...devices['Desktop Firefox'], storageState: authFile },
      dependencies: ['setup'],
    },
    {
      name: 'webkit',
      testIgnore: /tests\/setup\/.*/,
      use: { ...devices['Desktop Safari'], storageState: authFile },
      dependencies: ['setup'],
    },
    // Mobile viewports
    {
      name: 'Mobile Chrome',
      testIgnore: /tests\/setup\/.*/,
      use: { ...devices['Pixel 5'], storageState: authFile },
      dependencies: ['setup'],
    },
    {
      name: 'Mobile Safari',
      testIgnore: /tests\/setup\/.*/,
      use: { ...devices['iPhone 12'], storageState: authFile },
      dependencies: ['setup'],
    },
  ],

  // Timeout for each test — 60s to accommodate Firefox which is ~30-40% slower in Docker
  timeout: 60000,

  // Expect timeout — 10s to match actionTimeout; Mobile Safari is ~40% slower under load
  expect: {
    timeout: 10000,
  },

  // Output folder for test artifacts
  outputDir: 'test-results',
})
