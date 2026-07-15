import { pt } from 'vuetify/locale'
import { lightTheme } from './app/assets/styles/tokens/tokens'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  modules: ['@pinia/nuxt', 'vuetify-nuxt-module', '@nuxt/eslint'],

  // Kit `Si` (ADR-013): componentes de ui/ sem prefixo de pasta — SiButton.vue → <SiButton>.
  components: [
    { path: '~/components/ui', pathPrefix: false },
    '~/components',
  ],

  // Vitrine do DS (ADR-013 §7): rotas /dev/* existem só em desenvolvimento — removidas
  // do build de produção.
  hooks: {
    'pages:extend'(pages) {
      if (process.env.NODE_ENV === 'production') {
        for (let i = pages.length - 1; i >= 0; i--) {
          const p = pages[i]
          if (p && (p.path === '/dev' || p.path.startsWith('/dev/'))) pages.splice(i, 1)
        }
      }
    },
  },

  // Fonte da marca — Plus Jakarta Sans via <link> (evita @import bloqueante no SCSS).
  app: {
    head: {
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap',
        },
      ],
    },
  },

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
        themes: { light: lightTheme },
      },
      icons: { defaultSet: 'mdi-svg' },
      // UI em pt-BR (ADR-012) com as mensagens nativas do Vuetify. O locale também rege
      // o parse de data digitada no VDateInput.
      locale: { locale: 'pt', fallback: 'en', messages: { pt } },
      // VDateInput ainda é labs (ADR-013 §6, form native-first) + composable de data com
      // o adaptador padrão do Vuetify; locale pt-BR = dd/MM/yyyy.
      labComponents: ['VDateInput'],
      date: { locale: { pt: 'pt-BR' } },
    },
  },
})
