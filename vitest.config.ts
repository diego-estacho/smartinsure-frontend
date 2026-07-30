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
    // Medido nesta suíte: o `setupNuxt` dos arquivos `@vitest-environment nuxt` sobe Vuetify +
    // auto-imports e o módulo do Vuetify sozinho leva ~9s; com a máquina carregada (API .NET e
    // dev server no mesmo host) passou dos 30s e reprovava arquivos DIFERENTES a cada rodada.
    // A folga é deliberada: o hook não deve ser o que reprova a suíte — quem reprova é asserção.
    hookTimeout: 90_000,
    // Mesmo motivo no corpo do teste: `mountSuspended` do shell foi medido em 5,2s, acima do
    // default de 5s. 30s cobre a variação sem esconder teste travado de verdade.
    testTimeout: 30_000,
    // Um único lugar para teste unitário: `tests/unit/**/*.spec.ts`. Havia dois `*.test.ts`
    // largados em `app/composables/` que este padrão não coletava — passavam por verdes sem
    // nunca rodar. Foram movidos para cá em vez de ampliar o padrão (code review, 2026-07-30).
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
