import { describe, expect, it } from 'vitest'
import { describeRequestError } from '../../../app/lib/errors'

describe('describeRequestError — recusa do servidor traduzida em texto', () => {
  it('403 vira mensagem de acesso restrito', () => {
    const message = describeRequestError({ response: { status: 403 } }, 'fallback')

    expect(message).toBe('Acesso restrito ao Administrador do Sistema.')
  })

  it('409 usa o detail do ProblemDetails do servidor, sem reimplementar a regra', () => {
    const message = describeRequestError(
      {
        response: { status: 409 },
        data: { title: 'Conflito', detail: 'Já existe um usuário com este e-mail na plataforma.' },
      },
      'fallback',
    )

    expect(message).toBe('Já existe um usuário com este e-mail na plataforma.')
  })

  it('400 sem detail cai no title do ProblemDetails', () => {
    const message = describeRequestError(
      { status: 400, data: { title: 'A corretora informada não está ativa.' } },
      'fallback',
    )

    expect(message).toBe('A corretora informada não está ativa.')
  })

  it('erro sem status conhecido usa o fallback da tela', () => {
    const message = describeRequestError(new Error('rede'), 'Não foi possível carregar os usuários.')

    expect(message).toBe('Não foi possível carregar os usuários.')
  })
})
