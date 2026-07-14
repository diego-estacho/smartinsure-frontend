import { temaClaro } from './app/assets/styles/tokens/tokens'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  modules: ['@pinia/nuxt', 'vuetify-nuxt-module', '@nuxt/eslint'],

  // Design tokens não-cromáticos (ADR-006). As cores vão pelo tema Vuetify abaixo.
  css: ['~/assets/styles/tokens/base.css'],

  typescript: { strict: true },

  // Config só-servidor do BFF (ADR-008): o browser nunca vê estes valores.
  // Preenchidos por env (NUXT_BACKEND_BASE_URL, NUXT_DEV_AUTH_ENABLED).
  runtimeConfig: {
    backendBaseUrl: '',
    devAuthEnabled: '',
    public: {},
  },

  // Vuetify 3 (ADR-010) com o tema dirigido pelos design tokens (tokens.ts).
  // Ícones em mdi-svg (tree-shakeable) — centralizados em app/lib/icons.ts (ADR-003).
  vuetify: {
    vuetifyOptions: {
      theme: {
        defaultTheme: 'light',
        themes: { light: temaClaro },
      },
      icons: { defaultSet: 'mdi-svg' },
    },
  },
})
