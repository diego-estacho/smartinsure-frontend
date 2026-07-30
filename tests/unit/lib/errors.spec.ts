import { describe, expect, it } from 'vitest'
import { describeRequestError } from '../../../app/lib/errors'

describe('describeRequestError — recusa do servidor traduzida em texto', () => {
  it('403 sem corpo (recusa da policy de rota) usa texto genérico de permissão', () => {
    const message = describeRequestError({ response: { status: 403 } }, 'fallback')

    expect(message).toBe('Você não tem permissão para esta operação.')
  })

  it('403 com ProblemDetails mostra o motivo do servidor, não um texto fixo', () => {
    const message = describeRequestError(
      {
        response: { status: 403 },
        data: {
          title: 'Acesso negado.',
          detail: 'Somente o Corretor Administrador da corretora ativa executa esta operação.',
        },
      },
      'fallback',
    )

    // Antes do fix, qualquer 403 dizia "restrito ao Administrador do Sistema" — errado para CA/TA.
    expect(message).toBe('Somente o Corretor Administrador da corretora ativa executa esta operação.')
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
