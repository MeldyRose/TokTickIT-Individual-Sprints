import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    {
      command: 'npm --prefix server run dev',
      url: 'http://localhost:3000/api/health',
      reuseExistingServer: true,
      timeout: 120 * 1000,
    },
    {
      command: 'npm --prefix client run dev -- --port 5173',
      url: 'http://localhost:5173',
      reuseExistingServer: true,
      timeout: 120 * 1000,
    },
  ],
});
