/**
 * Design tokens — fonte única de verdade visual (ADR-006, whitelabel por corretora).
 *
 * Nenhum valor visual (cor, tipografia, espaçamento, raio, elevação, movimento) pode
 * ser hardcoded em componente: tudo sai daqui. Trocar de corretora = trocar os tokens,
 * nunca o código. Os valores abaixo são o tema-base NEUTRO (placeholder); a paleta de
 * cada corretora sobrescreve estes tokens no whitelabel.
 *
 * - As CORES alimentam o tema do Vuetify (ADR-010) — ver nuxt.config.ts.
 * - Os demais tokens (espaçamento, raio, tipografia, elevação, movimento) são expostos
 *   como CSS custom properties em `base.css` e consumidos por `var(--...)`.
 */

/** Cores do tema base neutro. Consumidas pelo tema Vuetify (nuxt.config.ts). */
export const coresBase = {
  primary: '#1E4B8F',
  secondary: '#5A6B7B',
  accent: '#0FA3A3',
  surface: '#FFFFFF',
  background: '#F6F7F9',
  info: '#2A6FDB',
  success: '#1F9D57',
  warning: '#C77700',
  error: '#C0392B',
} as const

export type NomeCor = keyof typeof coresBase

/** Tema claro no formato que o Vuetify espera (ADR-010). */
export const temaClaro = {
  dark: false,
  colors: { ...coresBase },
}

export const tokens = { cores: coresBase } as const
