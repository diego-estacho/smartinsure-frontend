/**
 * Validação de documentos (CPF/CNPJ) por dígito verificador — não só formato.
 * Código utilitário → inglês. Rejeita sequências repetidas (ex.: 000.000.000-00).
 *
 * CNPJ é ALFANUMÉRICO a partir de 2026: os 12 primeiros caracteres podem ter letras;
 * os 2 dígitos verificadores continuam numéricos. O cálculo usa o valor ASCII-48 de
 * cada caractere ('0'→0 … '9'→9, 'A'→17 … 'Z'→42), com os mesmos pesos do CNPJ clássico.
 */

/** CPF válido por dígito verificador (aceita com ou sem máscara). */
export function isValidCpf(input: string): boolean {
  const cpf = String(input).replace(/\D/g, '')
  if (cpf.length !== 11) return false
  if (/^(\d)\1{10}$/.test(cpf)) return false // todos iguais

  const digit = (sliceLen: number): number => {
    let sum = 0
    for (let i = 0; i < sliceLen; i++) sum += Number(cpf[i]) * (sliceLen + 1 - i)
    const mod = sum % 11
    return mod < 2 ? 0 : 11 - mod
  }
  return digit(9) === Number(cpf[9]) && digit(10) === Number(cpf[10])
}

/** CNPJ válido por dígito verificador — suporta o formato alfanumérico (2026). */
export function isValidCnpj(input: string): boolean {
  const cnpj = String(input).replace(/[^0-9A-Za-z]/g, '').toUpperCase()
  if (cnpj.length !== 14) return false
  if (/^(.)\1{13}$/.test(cnpj)) return false // todos iguais
  if (!/^\d{2}$/.test(cnpj.slice(12))) return false // DVs são numéricos

  const value = (c: string): number => c.charCodeAt(0) - 48
  const digit = (len: number): number => {
    const weights = len === 12
      ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
      : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    let sum = 0
    for (let i = 0; i < len; i++) sum += value(cnpj[i]!) * weights[i]!
    const mod = sum % 11
    return mod < 2 ? 0 : 11 - mod
  }
  return digit(12) === Number(cnpj[12]) && digit(13) === Number(cnpj[13])
}

/** Dispara CPF (11) ou CNPJ (14) pelo comprimento; false se não for nenhum. */
export function isValidCpfCnpj(input: string): boolean {
  const clean = String(input).replace(/[^0-9A-Za-z]/g, '')
  if (clean.length === 11) return isValidCpf(clean)
  if (clean.length === 14) return isValidCnpj(clean)
  return false
}

/** Formata CNPJ numérico ou alfanumérico para exibição. */
export function formatCnpj(input: string): string {
  const clean = String(input).replace(/[^0-9A-Za-z]/g, '').toUpperCase()
  if (clean.length !== 14) return input
  return `${clean.slice(0, 2)}.${clean.slice(2, 5)}.${clean.slice(5, 8)}/${clean.slice(8, 12)}-${clean.slice(12)}`
}
