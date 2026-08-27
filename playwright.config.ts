import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  workers: 1,
  timeout: 45_000,
  expect: { timeout: 10_000 },
  use: { baseURL: 'http://localhost:5173', trace: 'retain-on-failure' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      command: 'npm.cmd run qa:server',
      cwd: '../BackFynar',
      url: 'http://127.0.0.1:3000/api/v1/health/live',
      reuseExistingServer: true,
      timeout: 60_000,
    },
    {
      command: 'npm.cmd run dev:front',
      cwd: '.',
      url: 'http://localhost:5173',
      reuseExistingServer: true,
      timeout: 60_000,
    },
  ],
})
