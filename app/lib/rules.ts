/**
 * Regras de validação (ADR-013 §6 — validação via `rules` nativo do Vuetify).
 * Cada regra é `(v) => true | string`; a string é a mensagem de erro em pt-BR (UI).
 * Funções em inglês (utilitário); mensagens em pt-BR.
 */
export type Rule = (value: unknown) => true | string

const isEmpty = (v: unknown): boolean =>
  v == null || v === '' || (Array.isArray(v) && v.length === 0)

export const required = (message = 'Campo obrigatório'): Rule =>
  v => (!isEmpty(v) ? true : message)

export const email = (message = 'E-mail inválido'): Rule =>
  v => (isEmpty(v) || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v)) ? true : message)

export const minLength = (min: number, message?: string): Rule =>
  v => (isEmpty(v) || String(v).length >= min ? true : message ?? `Mínimo de ${min} caracteres`)

export const maxLength = (max: number, message?: string): Rule =>
  v => (isEmpty(v) || String(v).length <= max ? true : message ?? `Máximo de ${max} caracteres`)

/**
 * Comprimento do documento: 11 = CPF, 14 = CNPJ. Checagem de formato, não de dígito
 * verificador. Remove só a pontuação da máscara (`. - /`) e conta os alfanuméricos —
 * o CNPJ passou a ser alfanumérico em 2026, então NÃO dá pra filtrar por `\d`.
 */
export const cpfCnpjFormat = (message = 'Documento inválido'): Rule =>
  (v) => {
    if (isEmpty(v)) return true
    const clean = String(v).replace(/[.\-/\s]/g, '')
    return clean.length === 11 || clean.length === 14 ? true : message
  }
