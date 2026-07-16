import { defineConfig } from '@playwright/test'

// E2E de jornada (ADR-005). Sobe o dev server e exercita a UI real.
export default defineConfig({
  testDir: './tests/e2e',
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://localhost:3000',
  },
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    // Dev-auth (ADR-009): sessão sintética só no E2E — nunca em produção.
    env: { NUXT_DEV_AUTH_ENABLED: 'true' },
  },
})
