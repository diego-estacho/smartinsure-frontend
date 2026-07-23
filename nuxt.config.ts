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

  // Design tokens não-cromáticos (ADR-006) + skin de componentes (ADR-014, carregado
  // depois para vencer o CSS do Vuetify no cascade). As cores vão pelo tema abaixo.
  css: ['~/assets/styles/tokens/base.css', '~/assets/styles/skin.css'],

  typescript: { strict: true },

  // Lib de gráficos unovis (ADR-020): transpilar o wrapper Vue (compat ESM/d3). O gráfico
  // em si é montado client-side (<ClientOnly>) porque toca o DOM.
  build: { transpile: ['@unovis/vue'] },

  // Config só-servidor do BFF (ADR-008): o browser nunca vê estes valores.
  // Preenchidos por env (NUXT_BACKEND_BASE_URL, NUXT_DEV_AUTH_ENABLED).
  runtimeConfig: {
    backendBaseUrl: '',
    devAuthEnabled: '',
    public: {},
  },

  // Vuetify 3 (ADR-010) com o tema dirigido pelos design tokens (tokens.ts).
  // Ícones em Lucide (ADR-021) — set customizado ligado em app/plugins/vuetify-icons.ts;
  // registry central em app/lib/icons.ts (ADR-003).
  vuetify: {
    vuetifyOptions: {
      theme: {
        defaultTheme: 'light',
        themes: { light: lightTheme },
      },
      // Defaults de componente validados no InsurePoint (ADR-014). Só o *comportamento*
      // de default (variante/densidade/cor por token); o acabamento fino vive em skin.css.
      // Não entram: `label` no chip (DS manda pill) nem ícones do template antigo.
      defaults: {
        VBtn: { color: 'primary' },
        VBadge: { color: 'primary' },
        VChip: { color: 'primary' },
        VList: { color: 'primary', density: 'compact' },
        VTabs: { color: 'primary', density: 'comfortable' },
        VTooltip: { location: 'top' },
        VMenu: { offset: '2px' },
        VCheckbox: { color: 'primary', density: 'comfortable', hideDetails: 'auto' },
        VCheckboxBtn: { color: 'primary' },
        VRadioGroup: { color: 'primary', density: 'comfortable', hideDetails: 'auto' },
        VRadio: { density: 'comfortable', hideDetails: 'auto' },
        VSwitch: { inset: true, color: 'primary', ripple: false, hideDetails: 'auto' },
        VSelect: { variant: 'outlined', color: 'primary', density: 'comfortable', hideDetails: 'auto' },
        VTextField: { variant: 'outlined', color: 'primary', density: 'comfortable', hideDetails: 'auto' },
        VTextarea: { variant: 'outlined', color: 'primary', density: 'comfortable', hideDetails: 'auto' },
        VProgressLinear: { height: 6, rounded: true, roundedBar: true },
        VNavigationDrawer: { touchless: true },
      },
      // 'custom' faz o módulo delegar os ícones ao nosso plugin (vuetify-icons.ts, ADR-021).
      icons: { defaultSet: 'custom' },
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
