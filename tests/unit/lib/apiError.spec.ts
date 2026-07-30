import { describe, expect, it } from 'vitest'
import { extractApiErrorMessage } from '../../../app/lib/apiError'

const FALLBACK = 'Não foi possível concluir a operação.'

describe('extractApiErrorMessage — mensagem tratada do backend, fallback só quando falta', () => {
  it('usa o detail do ProblemDetails (mensagem da regra/integração)', () => {
    const err = { data: { title: 'Falha na comunicação com a seguradora.', detail: 'TAG obrigatória não informada.' } }
    expect(extractApiErrorMessage(err, FALLBACK)).toBe('TAG obrigatória não informada.')
  })

  it('prioriza erro de campo (validação) sobre detail/title', () => {
    const err = { data: { title: 'Requisição inválida.', detail: 'x', errors: { Email: ['E-mail inválido.'] } } }
    expect(extractApiErrorMessage(err, FALLBACK)).toBe('E-mail inválido.')
  })

  it('cai no title quando não há detail nem errors', () => {
    const err = { data: { title: 'Conflito de estado.' } }
    expect(extractApiErrorMessage(err, FALLBACK)).toBe('Conflito de estado.')
  })

  it('usa o fallback quando o backend não devolveu corpo (rede/timeout)', () => {
    expect(extractApiErrorMessage(new Error('Network Error'), FALLBACK)).toBe(FALLBACK)
    expect(extractApiErrorMessage(null, FALLBACK)).toBe(FALLBACK)
    expect(extractApiErrorMessage({ data: {} }, FALLBACK)).toBe(FALLBACK)
  })

  it('ignora campos vazios/em branco e cai no próximo', () => {
    const err = { data: { detail: '   ', title: 'Categoria.' } }
    expect(extractApiErrorMessage(err, FALLBACK)).toBe('Categoria.')
  })

  it('403 sem corpo (recusa da policy de rota) usa texto genérico de permissão, não o fallback da tela', () => {
    expect(extractApiErrorMessage({ response: { status: 403 } }, FALLBACK))
      .toBe('Você não tem permissão para esta operação.')
  })

  it('403 com ProblemDetails mostra o motivo do servidor, não o genérico de permissão', () => {
    const err = {
      response: { status: 403 },
      data: { title: 'Acesso negado.', detail: 'Somente o Corretor Administrador da corretora ativa executa esta operação.' },
    }
    expect(extractApiErrorMessage(err, FALLBACK))
      .toBe('Somente o Corretor Administrador da corretora ativa executa esta operação.')
  })

  it('lê o status tanto de error.status quanto de error.response.status', () => {
    expect(extractApiErrorMessage({ status: 403 }, FALLBACK)).toBe('Você não tem permissão para esta operação.')
  })
})
