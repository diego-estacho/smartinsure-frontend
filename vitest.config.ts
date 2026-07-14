import { defineConfig } from 'vitest/config'

// Testes unitários/componente (ADR-005). E2E de jornada ficam no Playwright.
export default defineConfig({
  test: {
    environment: 'happy-dom',
    include: ['tests/unit/**/*.spec.ts'],
    coverage: {
      provider: 'v8',
      reportsDirectory: './coverage',
      include: ['app/**/*.{ts,vue}', 'server/**/*.ts'],
      // Gate de 80% (QUALITY_SCORE) é ligado quando houver código de domínio real;
      // no scaffold, forçar 80% reprovaria por config sem comportamento.
    },
  },
})
