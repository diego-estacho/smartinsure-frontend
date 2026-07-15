// @ts-check
// Flat config do @nuxt/eslint, gerado por `nuxt prepare` em .nuxt/eslint.config.mjs.
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt({
  rules: {
    // Componentes sempre em PascalCase no template — inclusive os do Vuetify
    // (`v-alert` → `VAlert`). O default só checa componentes "registrados"; os do
    // Vuetify são auto-registrados globais, então `registeredComponentsOnly: false`.
    'vue/component-name-in-template-casing': ['error', 'PascalCase', {
      registeredComponentsOnly: false,
    }],
  },
})
