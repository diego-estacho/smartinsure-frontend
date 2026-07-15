/**
 * Regras de validação (ADR-013 §6 — validação via `rules` nativo do Vuetify).
 * Cada regra é `(v) => true | string`; a string é a mensagem de erro em pt-BR (UI).
 * Funções em inglês (utilitário); mensagens em pt-BR.
 */
import { isValidCpf, isValidCnpj, isValidCpfCnpj } from '~/lib/documents'

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
 * Comprimento do documento: 11 = CPF, 14 = CNPJ. Checagem de FORMATO apenas (não valida
 * dígito verificador). Prefira `cpf`/`cnpj`/`cpfCnpj` para rejeitar documentos inválidos
 * como `000.000.000-00`.
 */
export const cpfCnpjFormat = (message = 'Documento inválido'): Rule =>
  (v) => {
    if (isEmpty(v)) return true
    const clean = String(v).replace(/[.\-/\s]/g, '')
    return clean.length === 11 || clean.length === 14 ? true : message
  }

/** CPF válido por dígito verificador (rejeita 000.000.000-00 etc.). */
export const cpf = (message = 'CPF inválido'): Rule =>
  v => (isEmpty(v) || isValidCpf(String(v)) ? true : message)

/** CNPJ válido por dígito verificador — suporta alfanumérico (2026). */
export const cnpj = (message = 'CNPJ inválido'): Rule =>
  v => (isEmpty(v) || isValidCnpj(String(v)) ? true : message)

/** CPF ou CNPJ válido por dígito verificador (dispara pelo comprimento). */
export const cpfCnpj = (message = 'CPF/CNPJ inválido'): Rule =>
  v => (isEmpty(v) || isValidCpfCnpj(String(v)) ? true : message)
