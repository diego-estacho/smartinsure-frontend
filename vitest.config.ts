import { fileURLToPath } from 'node:url'
import { defineVitestConfig } from '@nuxt/test-utils/config'

// Testes unitários/componente (ADR-005). E2E de jornada ficam no Playwright.
// Ambiente padrão happy-dom (testes puros); testes de componente optam pelo ambiente
// `nuxt` por arquivo com `// @vitest-environment nuxt` (auto-imports, alias, Vuetify).
export default defineVitestConfig({
  // Alias `~`/`@` → app/ (Nuxt 4) também nos testes puros happy-dom.
  resolve: {
    alias: {
      '~': fileURLToPath(new URL('./app', import.meta.url)),
      '@': fileURLToPath(new URL('./app', import.meta.url)),
    },
  },
  test: {
    environment: 'happy-dom',
    // O `setupNuxt` dos arquivos `@vitest-environment nuxt` sobe Vuetify + auto-imports e passa
    // de 30s em máquina carregada (o módulo do Vuetify sozinho leva ~9s) — 30s tornava a suíte
    // flaky, falhando arquivos diferentes a cada rodada.
    hookTimeout: 90_000,
    // Mesmo motivo no corpo do teste: `mountSuspended` de tela grande (ex.: shell) passa dos
    // 5s default em máquina carregada — o default fazia a suíte reprovar por tempo, não por regra.
    testTimeout: 30_000,
    // Inclui os `*.test.ts` colocados ao lado do código (app/, server/): sem isso eles são
    // coletados por ninguém e passam por verdes sem nunca rodar.
    include: ['tests/unit/**/*.spec.ts', 'app/**/*.test.ts', 'server/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reportsDirectory: './coverage',
      include: ['app/**/*.{ts,vue}', 'server/**/*.ts'],
      // Gate de 80% (QUALITY_SCORE) é ligado quando houver código de domínio real;
      // no scaffold, forçar 80% reprovaria por config sem comportamento.
    },
  },
})
