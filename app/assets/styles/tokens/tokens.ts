/**
 * Design tokens — cores (fonte única de verdade cromática, ADR-006 + ADR-013).
 *
 * Nenhuma cor é hardcoded em componente: tudo sai daqui e alimenta o tema Vuetify
 * (ADR-010, ver nuxt.config.ts). Os valores são a **skin padrão do SmartInsure**,
 * destilados da identidade real (verde + slate). Trocar de corretora = trocar os
 * valores de marca, nunca o código.
 *
 * Whitelabel (ADR-013 §3): a corretora troca só as cores de MARCA (primary/secondary)
 * + logo — no futuro, vindas do backend e reaplicadas no tema em runtime. As cores
 * SEMÂNTICAS (success/warning/error/info) são lei da plataforma e NÃO são whitelabel:
 * ficam como literais próprios (mesmo `success` coincidindo hoje com o verde de marca),
 * pra que trocar `primary` nunca recolorir um estado de sucesso/erro por acidente.
 *
 * Nomenclatura: identificadores em inglês (código utilitário, AGENTS.md). Só termos de
 * domínio seguem o glossário em pt-BR — o que não se aplica a design tokens.
 *
 * Os tokens não-cromáticos (espaçamento, raio, tipografia, elevação, movimento) vivem
 * em `base.css` como CSS custom properties e são consumidos por `var(--si-...)`.
 */

/** Cores de MARCA — o que a corretora troca no whitelabel (ADR-013 §3). */
export const brandColors = {
  primary: '#22C55E', // verde
  secondary: '#64748B', // slate
} as const

/** Cores SEMÂNTICAS — lei da plataforma, nunca whitelabel. */
export const semanticColors = {
  success: '#22C55E', // literal próprio (não referencia primary)
  info: '#0EA5E9',
  warning: '#F59E0B',
  error: '#EF4444',
} as const

/** Cores de SUPERFÍCIE e texto — base neutra da plataforma. */
export const surfaceColors = {
  background: '#F8FAFC',
  surface: '#FFFFFF',
} as const

/** Paleta completa consumida pelo tema Vuetify (inclui on-* e darken-1). */
export const baseColors = {
  ...brandColors,
  ...semanticColors,
  ...surfaceColors,

  'on-primary': '#FFFFFF',
  'primary-darken-1': '#16A34A', // verde-700
  'on-secondary': '#FFFFFF',
  'secondary-darken-1': '#475569',

  'on-success': '#FFFFFF',
  'success-darken-1': '#16A34A',
  'on-info': '#FFFFFF',
  'info-darken-1': '#0284C7',
  'on-warning': '#FFFFFF',
  'warning-darken-1': '#D97706',
  'on-error': '#FFFFFF',
  'error-darken-1': '#DC2626',

  'on-background': '#0F172A', // carvão
  'on-surface': '#0F172A', // carvão
} as const

export type ColorName = keyof typeof baseColors

/** Tema claro no formato que o Vuetify espera (ADR-010). Só claro por ora (ADR-013 §4). */
export const lightTheme = {
  dark: false,
  colors: { ...baseColors },
}

export const tokens = {
  colors: baseColors,
  brand: brandColors,
  semantic: semanticColors,
  surface: surfaceColors,
} as const
