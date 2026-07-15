import { describe, it, expect } from 'vitest'
import { Mask } from 'maska'
import { MASK_CPF, MASK_CNPJ, MASK_CEP, MASK_PHONE, maskTokens } from '../../app/lib/masks'

// ADR-013 §6 — máscaras de documento/telefone/CEP. Valida o formato produzido pela maska.
describe('máscaras (ADR-013 §6)', () => {
  it('CPF: 11 dígitos → ###.###.###-##', () => {
    expect(new Mask({ mask: MASK_CPF }).masked('12345678909')).toBe('123.456.789-09')
  })

  it('CNPJ alfanumérico (2026): letras viram maiúsculas e formatam', () => {
    const out = new Mask({ mask: MASK_CNPJ, tokens: maskTokens }).masked('12abc34501de35')
    expect(out).toBe('12.ABC.345/01DE-35')
  })

  it('CNPJ numérico legado ainda formata (N aceita dígito)', () => {
    const out = new Mask({ mask: MASK_CNPJ, tokens: maskTokens }).masked('11222333000181')
    expect(out).toBe('11.222.333/0001-81')
  })

  it('CEP: 8 dígitos → #####-###', () => {
    expect(new Mask({ mask: MASK_CEP }).masked('12345678')).toBe('12345-678')
  })

  it('telefone dinâmico: fixo e celular pelo comprimento', () => {
    const m = new Mask({ mask: [...MASK_PHONE] })
    expect(m.masked('1133334444')).toBe('(11) 3333-4444')
    expect(m.masked('11988887777')).toBe('(11) 98888-7777')
  })
})
