/**
 * Set de ícones Lucide no Vuetify (ADR-021). O vuetify-nuxt-module, com
 * `icons.defaultSet: 'custom'` (nuxt.config), delega a configuração de ícones para este
 * plugin via hook `vuetify:configuration`. Aqui registramos:
 *  - o set `lucide`, que resolve a chave do ícone (ex.: 'shieldCheck') para o componente
 *    Lucide do registry central `lib/icons.ts`, com traço 1.5 e `currentColor`;
 *  - os `aliases` dos `$`-internos do Vuetify (checkbox, radio, chevrons, sort, close…),
 *    apontando para chaves Lucide — assim o kit inteiro, inclusive os internos, fala Lucide.
 * Nenhum SVG inline: a fonte é sempre o registry (ADR-003, FRONTEND §Ícones).
 */
import { h } from 'vue'
import type { IconProps, IconSet } from 'vuetify'
import { appIcons, type AppIconName } from '~/lib/icons'

const lucideSet: IconSet = {
  component: (props: IconProps) => {
    const value = props.icon
    const cmp = typeof value === 'string' && value in appIcons
      ? appIcons[value as AppIconName]
      : value
    // Style inline (vence as regras de stylesheet do Vuetify, que não são `!important`):
    //  - width/height 1em: o `.v-icon__svg{width:100%}` do Vuetify estoura fora de um box
    //    de tamanho fixo; 1em = font-size do VIcon = o size pedido;
    //  - fill:none: o Vuetify desenha para MDI (baseado em fill) e aplica `.v-icon__svg{fill:
    //    currentColor}`, que sobrescreveria o atributo `fill="none"` do Lucide e PINTARIA os
    //    ícones de path fechado (user, lock, eye…). Lucide é baseado em traço → forçamos fill:none.
    // Cor por currentColor (Lucide usa stroke=currentColor); traço 1.5 do DS.
    return h(cmp as never, {
      class: 'v-icon__svg',
      style: { width: '1em', height: '1em', fill: 'none' },
      'stroke-width': 1.5,
    })
  },
}

/** `$`-internos do Vuetify → chaves Lucide do registry (ADR-021 §2). */
const aliases = {
  complete: 'check', cancel: 'circleX', close: 'close', delete: 'circleX', clear: 'circleX',
  success: 'circleCheck', info: 'info', warning: 'alertTriangle', error: 'circleX',
  prev: 'chevronLeft', next: 'chevronRight',
  checkboxOn: 'squareCheck', checkboxOff: 'square', checkboxIndeterminate: 'squareMinus',
  delimiter: 'circle', sortAsc: 'arrowUp', sortDesc: 'arrowDown',
  expand: 'chevronDown', menu: 'menu', subgroup: 'chevronDown', dropdown: 'chevronDown',
  collapse: 'chevronUp', radioOn: 'circleDot', radioOff: 'circle', edit: 'pencil',
  loading: 'refresh', first: 'chevronsLeft', last: 'chevronsRight', unfold: 'unfold',
  file: 'paperclip', plus: 'plus', minus: 'minus', calendar: 'calendar', upload: 'upload',
}

export default defineNuxtPlugin({
  name: 'si:vuetify:lucide-icons',
  order: -25,
  parallel: true,
  setup(nuxtApp) {
    nuxtApp.hook('vuetify:configuration', ({ vuetifyOptions }) => {
      vuetifyOptions.icons = { defaultSet: 'lucide', sets: { lucide: lucideSet }, aliases }
    })
  },
})
