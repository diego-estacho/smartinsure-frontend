import { describe, expect, it } from 'vitest'
import { formatTaxPercentage, isSameTaxPercentage, parseTaxPercentage } from '~/lib/format'

/**
 * A taxa sai da Seguradora como número, é exibida como texto pt-BR no campo editável e volta pelo
 * mesmo campo. Formatar e ler são as duas metades de uma coisa só: se saírem de sincronia, o corretor
 * vê um valor e a Seguradora recebe outro. Estes testes fixam a ida e a volta.
 */
describe('taxa: formatação e leitura do campo editável', () => {
  it('formata em pt-BR, com vírgula decimal e sem separador de milhar', () => {
    // O ponto de milhar quebraria a leitura de volta, que troca vírgula por ponto.
    expect(formatTaxPercentage(0.36)).toBe('0,36')
    expect(formatTaxPercentage(1.8)).toBe('1,8')
    expect(formatTaxPercentage(1234.5)).toBe('1234,5')
  })

  it('preserva o valor na ida e volta', () => {
    for (const value of [0.36, 1.8, 2.5, 12.75, 1234.5]) {
      expect(parseTaxPercentage(formatTaxPercentage(value))).toBe(value)
    }
  })

  it('lê o que o corretor digita, com vírgula ou ponto', () => {
    expect(parseTaxPercentage('0,36')).toBe(0.36)
    expect(parseTaxPercentage('0.36')).toBe(0.36)
    expect(parseTaxPercentage(' 2,5 ')).toBe(2.5)
  })

  it('devolve NaN para o que não é número, em vez de inventar zero', () => {
    // Zero seria uma taxa válida no campo; NaN deixa a validação de formato acusar.
    expect(parseTaxPercentage('')).toBeNaN()
    expect(parseTaxPercentage('abc')).toBeNaN()
  })

  it('taxa com mais casas do que o campo exibe continua sendo a mesma taxa', () => {
    // A Seguradora pode devolver mais casas do que o campo mostra: o valor volta do campo arredondado
    // e NÃO é igual ao original — comparar por igualdade numérica acusaria uma edição que não houve.
    const original = 0.361255
    const ida = parseTaxPercentage(formatTaxPercentage(original))

    expect(ida).not.toBe(original)
    expect(isSameTaxPercentage(ida, original)).toBe(true)
  })

  it('mudança visível na última casa exibida é edição de verdade', () => {
    expect(isSameTaxPercentage(0.3612, 0.3613)).toBe(false)
    expect(isSameTaxPercentage(1.8, 2.5)).toBe(false)
  })
})
