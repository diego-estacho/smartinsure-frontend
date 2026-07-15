import { describe, it, expect } from 'vitest'
import { required, email, minLength, maxLength, cpfCnpjFormat, cpf, cnpj, cpfCnpj } from '../../app/lib/rules'

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

  it('cpfCnpjFormat: valida só o formato (comprimento 11/14)', () => {
    expect(cpfCnpjFormat()('123.456.789-09')).toBe(true)
    expect(cpfCnpjFormat()('12.ABC.345/01DE-35')).toBe(true)
    expect(cpfCnpjFormat()('123')).toBe('Documento inválido')
    expect(cpfCnpjFormat()('')).toBe(true)
  })

  it('cpf/cnpj/cpfCnpj: validam dígito verificador (rejeitam 000... e DV errado)', () => {
    expect(cpf()('111.444.777-35')).toBe(true)
    expect(cpf()('000.000.000-00')).toBe('CPF inválido')
    expect(cnpj()('11.222.333/0001-81')).toBe(true)
    expect(cnpj()('12.ABC.345/01DE-35')).toBe(true) // alfanumérico 2026
    expect(cnpj()('11.222.333/0001-80')).toBe('CNPJ inválido')
    expect(cpfCnpj()('111.444.777-35')).toBe(true)
    expect(cpfCnpj()('000.000.000-00')).toBe('CPF/CNPJ inválido')
    expect(cpfCnpj()('')).toBe(true) // vazio fica com o required
  })
})
