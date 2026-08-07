// @vitest-environment nuxt
import { describe, expect, it, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'
import Step2Insured from '~/components/quotation-groups/Step2Insured.vue'
import { useQuotationGroupWizardStore } from '~/stores/quotationGroupWizard'
import { useQuotationGroups } from '~/composables/useQuotationGroups'

/**
 * RN-503 — o endereço do Segurado da oferta é **escolhido** pelo corretor entre os do cadastro da
 * Pessoa, e é a escolha que acompanha o salvar do grupo (o backend replica os valores). O principal
 * vem pré-selecionado; o corretor pode apontar outro.
 */
describe('RN-503 endereço do Segurado da oferta', () => {
  const INSURED_WITH_TWO_ADDRESSES = {
    items: [{
      id: 'in-x',
      documentNumber: '33333333000133',
      name: 'Unica Servicos LTDA',
      socialName: null,
      type: 'PJ',
      isPrivateSector: null,
      roles: ['Insured'],
      mainAddress: {
        zipCode: '04538133',
        street: 'Avenida Faria Lima',
        number: '3477',
        complement: null,
        neighborhood: 'Itaim',
        city: 'São Paulo',
        state: 'SP',
      },
      addresses: [
        {
          id: 'addr-main',
          isMain: true,
          zipCode: '04538133',
          street: 'Avenida Faria Lima',
          number: '3477',
          complement: null,
          neighborhood: 'Itaim',
          city: 'São Paulo',
          state: 'SP',
        },
        {
          id: 'addr-extra',
          isMain: false,
          zipCode: '01310930',
          street: 'Avenida Paulista',
          number: '1578',
          complement: '10º andar',
          neighborhood: 'Bela Vista',
          city: 'São Paulo',
          state: 'SP',
        },
      ],
    }],
    notice: null,
  }

  it('lista todos os endereços do segurado e pré-seleciona o principal', async () => {
    const store = useQuotationGroupWizardStore()
    registerEndpoint('/api/persons', { method: 'GET', once: true, handler: () => INSURED_WITH_TWO_ADDRESSES })

    const w = await mountSuspended(Step2Insured)
    await w.find('input').setValue('unica')
    await w.find('form').trigger('submit')
    await vi.waitFor(() => expect(store.insured).not.toBeNull())

    expect(w.text()).toContain('Avenida Faria Lima')
    expect(w.text()).toContain('Avenida Paulista')
    expect(store.insured?.addressId).toBe('addr-main')
  })

  it('escolher outro endereço passa a valer para a oferta', async () => {
    const store = useQuotationGroupWizardStore()
    registerEndpoint('/api/persons', { method: 'GET', once: true, handler: () => INSURED_WITH_TWO_ADDRESSES })

    const w = await mountSuspended(Step2Insured)
    await w.find('input').setValue('unica')
    await w.find('form').trigger('submit')
    // Espera a LISTA renderizar: o store é compartilhado entre os testes, então `insured` já pode
    // estar preenchido de antes e não serve como sinal de que esta montagem terminou.
    await vi.waitFor(() => expect(w.findAll('input[type="radio"]').length).toBe(2))

    // Marcar o rádio do endereço adicional — é o que o corretor faz na tela.
    const extra = w.findAll('input[type="radio"]').find(radio => radio.attributes('value') === 'addr-extra')
    await extra!.setValue(true)
    await extra!.trigger('change')
    await flushPromises()

    expect(store.insured?.addressId).toBe('addr-extra')
  })

  it('o endereço escolhido vai no corpo do salvar da oferta', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ id: 'qg-1', status: 'Draft' })
    const { saveQuotationGroup } = useQuotationGroups(fetchMock as unknown as typeof $fetch)

    await saveQuotationGroup({
      policyHolderId: 'p',
      branchId: null,
      insuredId: 'i',
      insuredAddressId: 'addr-extra',
      scope: { mode: 'all', insurerIds: [] },
      risk: {
        modalityId: 'm',
        insuredAmount: 1000,
        startDate: '2026-01-01',
        endDate: '2026-02-01',
        coverageMulta: false,
        coverageLabor: false,
      },
    }, null)

    expect(fetchMock).toHaveBeenCalledWith('/api/quotation-groups', {
      method: 'POST',
      body: expect.objectContaining({ insuredAddressId: 'addr-extra' }),
    })
  })
})
