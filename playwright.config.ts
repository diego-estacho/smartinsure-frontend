import { defineConfig } from '@playwright/test'

// E2E de jornada (ADR-005). Sobe o dev server e exercita a UI real.
/** Suíte que fala com a API e o provedor de identidade reais, em vez de mockar o BFF. */
const JOURNEY_SPECS = /perfis-e-usuarios\.spec\.ts/

export default defineConfig({
  testDir: './tests/e2e',
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://localhost:3000',
  },
  /*
   * Dois projetos porque as suítes têm pré-requisitos diferentes: `ui` mocka o BFF e roda só com o
   * dev server; `jornadas` exige a API e o Casdoor de dev de pé, e cria dados reais. Separar evita
   * que `pnpm test:e2e` falhe por um pré-requisito que ela não precisa.
   */
  projects: [
    { name: 'ui', testIgnore: JOURNEY_SPECS },
    /*
     * Timeout maior que o padrão de 30s: cada passo fala com a API e o Casdoor reais, e o dev
     * server compila as rotas sob demanda na primeira visita. Com 30s, a jornada reprovava por
     * orçamento de tempo, não por defeito.
     */
    { name: 'jornadas', testMatch: JOURNEY_SPECS, timeout: 120_000 },
  ],
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    // Dev-auth (ADR-009): sessão sintética só no E2E — nunca em produção.
    env: { NUXT_DEV_AUTH_ENABLED: 'true' },
  },
})
