/**
 * Máscaras de input (ADR-013 §6). maska v3. Consumidas pelos wrappers `Si*` de campo.
 * Código utilitário → nomes em inglês; os padrões são de documentos brasileiros.
 *
 * CNPJ passa a ser ALFANUMÉRICO em 2026: os 12 primeiros caracteres podem ter letras,
 * os 2 últimos (dígitos verificadores) seguem numéricos. Por isso o token `N`
 * (alfanumérico, forçado a maiúsculo) no lugar de `#` nas posições da raiz/ordem.
 */
import type { MaskaDetail, MaskTokens } from 'maska'

export const MASK_CPF = '###.###.###-##'
export const MASK_CNPJ_LEGACY = '##.###.###/####-##' // só dígitos (compatível)
export const MASK_CNPJ = 'NN.NNN.NNN/NNNN-##' // 2026 alfanumérico (N aceita dígito também)
export const MASK_CEP = '#####-###'
export const MASK_PHONE = ['(##) ####-####', '(##) #####-####'] as const // fixo / celular

/** CPF ou CNPJ no mesmo campo — maska escolhe pelo comprimento. */
export const MASK_CPF_CNPJ = [MASK_CPF, MASK_CNPJ] as const

/** Token `N`: alfanumérico em maiúsculo (raiz do CNPJ novo). */
export const maskTokens: MaskTokens = {
  N: { pattern: /[0-9A-Za-z]/, transform: (chr: string) => chr.toUpperCase() },
}

export type { MaskaDetail }
