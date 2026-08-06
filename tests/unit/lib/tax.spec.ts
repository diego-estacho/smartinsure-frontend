import { describe, expect, it } from 'vitest'
import { formatTaxPercentage, parseTaxPercentage } from '~/lib/format'

/**
 * A taxa sai da Seguradora como número, é exibida como texto pt-BR no campo editável e volta pelo
 * mesmo campo. Formatar e ler são as duas metades de uma coisa só: se saírem de sincronia, o corretor
 * vê um valor e a Seguradora recebe outro. Estes testes fixam a ida e a volta.
 */
describe('RN-504 taxa: formatação e leitura do campo editável', () => {
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

  it('arredonda para 4 casas: taxa com mais casas volta do campo diferente do original', () => {
    // Limite conhecido da exibição — quem decide se isso é "a mesma taxa" é o servidor (RN-504),
    // não a tela. Aqui só se fixa que a ida e volta perde as casas além da quarta.
    const original = 0.361255
    const ida = parseTaxPercentage(formatTaxPercentage(original))

    expect(ida).toBe(0.3613)
    expect(ida).not.toBe(original)
  })
})
