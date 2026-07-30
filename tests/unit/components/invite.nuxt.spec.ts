// @vitest-environment nuxt
import { describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import invite from '../../../app/pages/invite.vue'

// RN-065 — tela de primeiro acesso: valida forma e não decide regra.
describe('RN-065 tela de primeiro acesso', () => {
  it('sem token na URL, avisa e desabilita a conclusão', async () => {
    const w = await mountSuspended(invite, { route: '/invite' })

    expect(w.text()).toContain('Link de convite sem token')
    const button = w.findAll('button').find(b => b.text().includes('Concluir primeiro acesso'))
    expect(button).toBeTruthy()
    expect(button!.attributes('disabled')).toBeDefined()
  })

  it('com token na URL, habilita a conclusão e pede senha e confirmação', async () => {
    const w = await mountSuspended(invite, { route: '/invite?token=tok-123' })

    expect(w.text()).not.toContain('Link de convite sem token')
    expect(w.text()).toContain('Defina sua senha')
    expect(w.find('#invite-password').exists()).toBe(true)
    expect(w.find('#invite-password-confirmation').exists()).toBe(true)
    const button = w.findAll('button').find(b => b.text().includes('Concluir primeiro acesso'))
    expect(button!.attributes('disabled')).toBeUndefined()
  })
})

describe('RN-065 BFF do primeiro acesso', () => {
  it('encaminha ao backend sem token de sessão (rota anônima)', async () => {
    const backendFetchMock = vi.fn().mockResolvedValue({
      userId: '01980000-0000-7000-8000-000000000005',
      name: 'Carla',
      email: 'carla@corretora.com.br',
      status: 'Active',
    })
    const runtimeConfig = useRuntimeConfig() as { backendBaseUrl: string }
    runtimeConfig.backendBaseUrl = 'https://backend.test'

    vi.stubGlobal('defineEventHandler', (handler: unknown) => handler)
    vi.stubGlobal('readBody', vi.fn().mockResolvedValue({ token: 'tok-123', password: 'senha-forte-1' }))
    vi.stubGlobal('$fetch', backendFetchMock)

    const { default: handler } = await import('../../../server/api/users/invitations/accept.post')
    await (handler as (event: unknown) => Promise<unknown>)({})

    expect(backendFetchMock).toHaveBeenCalledWith('/api/v1/users/invitations/accept', {
      baseURL: 'https://backend.test',
      method: 'POST',
      body: { token: 'tok-123', password: 'senha-forte-1' },
    })

    vi.unstubAllGlobals()
    vi.resetModules()
  })
})
