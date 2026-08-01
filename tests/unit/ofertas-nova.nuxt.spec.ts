// @vitest-environment nuxt
import { describe, it, expect, beforeEach } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
import { useState } from '#imports'
import NovaOferta from '~/pages/ofertas/nova.vue'
import { useQuotationGroupWizardStore } from '~/stores/quotationGroupWizard'

// Contexto da sessão (RN-064) como o `/api/me` devolve: o vínculo Usuário↔Corretora já resolvido, com
// uma Corretora ativa. É a fonte da Corretora da oferta (substitui o antigo mock de runtime config).
const CONTEXT = {
  id: 'u-1',
  name: 'Diego',
  email: 'diego@corretora.com.br',
  status: 'Active',
  systemProfileName: null,
  activeBrokerageId: 'brk-9',
  activePolicyHolderId: null,
  brokerages: [
    { id: 'brk-9', documentNumber: '11222333000181', name: 'Corretora Nove', profileName: 'BrokerageAdministrator', isActive: true },
  ],
  policyHolders: [],
}

// Sem `?grupo` na rota a página não reidrata; stubamos o wizard para exercitar só a cola do onMounted.
const mountOpts = { route: '/ofertas/nova', global: { stubs: { QuotationGroupsWizard: true } } }

describe('nova oferta — Corretora vem da sessão ativa (RN-064)', () => {
  beforeEach(() => {
    useQuotationGroupWizardStore().reset()
    useState('si-user-context').value = null
  })

  it('preenche a Corretora do wizard com a Corretora ativa da sessão', async () => {
    useState('si-user-context').value = CONTEXT
    const store = useQuotationGroupWizardStore()
    await mountSuspended(NovaOferta, mountOpts)
    await flushPromises()
    expect(store.brokerageId).toBe('brk-9')
  })

  it('sem Corretora ativa não inventa Corretora (brokerageId fica nulo)', async () => {
    useState('si-user-context').value = { ...CONTEXT, activeBrokerageId: null }
    const store = useQuotationGroupWizardStore()
    await mountSuspended(NovaOferta, mountOpts)
    await flushPromises()
    expect(store.brokerageId).toBeNull()
  })
})
