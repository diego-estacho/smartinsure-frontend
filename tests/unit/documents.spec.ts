import { describe, it, expect } from 'vitest'
import { formatCnpj, isValidCpf, isValidCnpj, isValidCpfCnpj } from '../../app/lib/documents'

// ADR-013 §6 — validação por dígito verificador (não só formato).
describe('validação de documentos', () => {
  it('CPF: aceita válido, rejeita DV errado e sequência repetida', () => {
    expect(isValidCpf('111.444.777-35')).toBe(true)
    expect(isValidCpf('11144477735')).toBe(true)
    expect(isValidCpf('123.456.789-00')).toBe(false) // DV errado
    expect(isValidCpf('000.000.000-00')).toBe(false) // todos iguais
    expect(isValidCpf('111.111.111-11')).toBe(false)
    expect(isValidCpf('123')).toBe(false)
  })

  it('CNPJ numérico: aceita válido, rejeita DV errado e repetição', () => {
    expect(isValidCnpj('11.222.333/0001-81')).toBe(true)
    expect(isValidCnpj('11222333000181')).toBe(true)
    expect(isValidCnpj('11.222.333/0001-80')).toBe(false) // DV errado
    expect(isValidCnpj('00.000.000/0000-00')).toBe(false) // todos iguais
  })

  it('CNPJ alfanumérico (2026): valida por dígito verificador', () => {
    expect(isValidCnpj('12.ABC.345/01DE-35')).toBe(true)
    expect(isValidCnpj('12ABC34501DE35')).toBe(true)
    expect(isValidCnpj('12.ABC.345/01DE-99')).toBe(false) // DV errado
  })

  it('cpfCnpj dispara pelo comprimento', () => {
    expect(isValidCpfCnpj('111.444.777-35')).toBe(true)
    expect(isValidCpfCnpj('11.222.333/0001-81')).toBe(true)
    expect(isValidCpfCnpj('000.000.000-00')).toBe(false)
    expect(isValidCpfCnpj('123')).toBe(false)
  })

  it('formatCnpj aplica máscara numérica e alfanumérica', () => {
    expect(formatCnpj('11222333000181')).toBe('11.222.333/0001-81')
    expect(formatCnpj('12abc34501de35')).toBe('12.ABC.345/01DE-35')
    expect(formatCnpj('123')).toBe('123')
  })
})
