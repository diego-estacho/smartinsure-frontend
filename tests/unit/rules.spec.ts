import { describe, it, expect } from 'vitest'
import { required, email, minLength, maxLength, cpfCnpjFormat } from '../../app/lib/rules'

// ADR-013 §6 — regras de validação (mensagens em pt-BR). true = válido; string = erro.
describe('regras de validação (ADR-013 §6)', () => {
  it('required: reprova vazio/null; aprova preenchido', () => {
    expect(required()('')).toBe('Campo obrigatório')
    expect(required()(null)).toBe('Campo obrigatório')
    expect(required()([])).toBe('Campo obrigatório')
    expect(required()('x')).toBe(true)
    expect(required('Obrigatório!')('')).toBe('Obrigatório!')
  })

  it('email: valida formato; ignora vazio (fica a cargo do required)', () => {
    expect(email()('a@b.com')).toBe(true)
    expect(email()('invalido')).toBe('E-mail inválido')
    expect(email()('')).toBe(true)
  })

  it('minLength/maxLength', () => {
    expect(minLength(3)('ab')).toBe('Mínimo de 3 caracteres')
    expect(minLength(3)('abc')).toBe(true)
    expect(maxLength(2)('abc')).toBe('Máximo de 2 caracteres')
    expect(maxLength(2)('ab')).toBe(true)
  })

  it('cpfCnpjFormat: aceita CPF (11) e CNPJ alfanumérico (14); conta alfanuméricos, não só dígitos', () => {
    expect(cpfCnpjFormat()('123.456.789-09')).toBe(true) // CPF
    expect(cpfCnpjFormat()('12.ABC.345/01DE-35')).toBe(true) // CNPJ alfanumérico 2026
    expect(cpfCnpjFormat()('11.222.333/0001-81')).toBe(true) // CNPJ numérico
    expect(cpfCnpjFormat()('123')).toBe('Documento inválido')
    expect(cpfCnpjFormat()('')).toBe(true) // vazio fica com o required
  })
})
