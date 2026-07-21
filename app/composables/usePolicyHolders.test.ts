import { afterEach, describe, expect, it, vi } from 'vitest'
import { usePolicyHolders } from './usePolicyHolders'

const fetchMock = vi.fn()
const api = fetchMock as unknown as typeof $fetch

afterEach(() => {
  fetchMock.mockReset()
})

describe('RN-025 — Jornada de Tomador — Listagem e detalhes', () => {
  it('lista tomadores com paginação e search', async () => {
    fetchMock.mockResolvedValueOnce({
      items: [
        {
          id: '01980000-0000-7000-8000-000000000010',
          documentNumber: '12345678000195',
          name: 'Acme Corp',
          socialName: 'Acme',
          isPrivateSector: true,
        },
      ],
      page: 1,
      pageSize: 20,
      totalCount: 1,
    })

    const { listPolicyHolders } = usePolicyHolders(api)
    const result = await listPolicyHolders({ page: 1, pageSize: 20, search: 'Acme' })

    expect(fetchMock).toHaveBeenCalledWith('/api/policy-holders', {
      method: 'GET',
      query: {
        page: 1,
        pageSize: 20,
        search: 'Acme',
      },
    })
    expect(result.items).toHaveLength(1)
    expect(result.items[0]!.name).toBe('Acme Corp')
  })

  it('cria tomador por CNPJ via BFF', async () => {
    fetchMock.mockResolvedValueOnce({
      id: '01980000-0000-7000-8000-000000000010',
      documentNumber: '12345678000195',
      name: 'Acme Corporation Ltda.',
      socialName: 'Acme',
      legalNatureCode: '2062',
      legalNatureDescription: 'Sociedade Anônima',
      isPrivateSector: true,
      addresses: [],
      appointments: [],
    })

    const { createPolicyHolder } = usePolicyHolders(api)
    const result = await createPolicyHolder({ cnpj: '12.345.678/0001-95' })

    expect(fetchMock).toHaveBeenCalledWith('/api/policy-holders', {
      method: 'POST',
      body: { cnpj: '12.345.678/0001-95' },
    })
    expect(result.name).toBe('Acme Corporation Ltda.')
  })

  it('busca detalhe de tomador com endereços e nomeações', async () => {
    fetchMock.mockResolvedValueOnce({
      id: '01980000-0000-7000-8000-000000000010',
      documentNumber: '12345678000195',
      name: 'Acme Corp',
      socialName: 'Acme',
      legalNatureCode: '2062',
      legalNatureDescription: 'Sociedade Anônima',
      isPrivateSector: true,
      addresses: [
        {
          id: 'addr1',
          zipCode: '01234-567',
          street: 'Rua A',
          number: '123',
          complement: null,
          neighborhood: 'Centro',
          city: 'São Paulo',
          state: 'SP',
          isMain: true,
        },
      ],
      appointments: [
        {
          id: 'appt1',
          brokerageId: 'brokerage1',
          brokerageName: 'Corretora X',
          brokerageDocumentNumber: '11222333000181',
          insurerId: 'insurer1',
          insurerName: 'Seguradora Y',
          insurerDocumentNumber: '12345678000195',
          status: 'Active',
          startedAt: '2026-01-01T00:00:00Z',
          endedAt: null,
        },
      ],
    })

    const { getPolicyHolder } = usePolicyHolders(api)
    const result = await getPolicyHolder('01980000-0000-7000-8000-000000000010')

    expect(fetchMock).toHaveBeenCalledWith('/api/policy-holders/01980000-0000-7000-8000-000000000010', {
      method: 'GET',
    })
    expect(result.addresses).toHaveLength(1)
    expect(result.addresses[0]!.isMain).toBe(true)
    expect(result.appointments).toHaveLength(1)
    expect(result.appointments[0]!.status).toBe('Active')
  })
})

describe('RN-026 — Endereços do Tomador', () => {
  it('adiciona endereço adicional', async () => {
    fetchMock.mockResolvedValueOnce({
      id: 'addr2',
      zipCode: '01234-567',
      street: 'Rua B',
      number: '456',
      complement: 'Apto 101',
      neighborhood: 'Vila Mariana',
      city: 'São Paulo',
      state: 'SP',
      isMain: false,
    })

    const { addAddress } = usePolicyHolders(api)
    const result = await addAddress('policy-holder-1', {
      zipCode: '01234-567',
      street: 'Rua B',
      number: '456',
      complement: 'Apto 101',
      neighborhood: 'Vila Mariana',
      city: 'São Paulo',
      state: 'SP',
    })

    expect(fetchMock).toHaveBeenCalledWith('/api/policy-holders/policy-holder-1/addresses', {
      method: 'POST',
      body: {
        zipCode: '01234-567',
        street: 'Rua B',
        number: '456',
        complement: 'Apto 101',
        neighborhood: 'Vila Mariana',
        city: 'São Paulo',
        state: 'SP',
      },
    })
    expect(result.isMain).toBe(false)
  })

  it('atualiza endereço adicional', async () => {
    fetchMock.mockResolvedValueOnce({
      id: 'addr2',
      zipCode: '01234-999',
      street: 'Rua B Alterada',
      number: '456',
      complement: null,
      neighborhood: 'Vila Mariana',
      city: 'São Paulo',
      state: 'SP',
      isMain: false,
    })

    const { updateAddress } = usePolicyHolders(api)
    await updateAddress('policy-holder-1', 'addr2', {
      zipCode: '01234-999',
      street: 'Rua B Alterada',
      number: '456',
      complement: null,
      neighborhood: 'Vila Mariana',
      city: 'São Paulo',
      state: 'SP',
    })

    expect(fetchMock).toHaveBeenCalledWith('/api/policy-holders/policy-holder-1/addresses/addr2', {
      method: 'PUT',
      body: {
        zipCode: '01234-999',
        street: 'Rua B Alterada',
        number: '456',
        complement: null,
        neighborhood: 'Vila Mariana',
        city: 'São Paulo',
        state: 'SP',
      },
    })
  })

  it('remove endereço adicional', async () => {
    fetchMock.mockResolvedValueOnce(undefined)

    const { deleteAddress } = usePolicyHolders(api)
    await deleteAddress('policy-holder-1', 'addr2')

    expect(fetchMock).toHaveBeenCalledWith('/api/policy-holders/policy-holder-1/addresses/addr2', {
      method: 'DELETE',
    })
  })
})

describe('RN-027/028 — Nomeações de Tomador', () => {
  it('cria nomeação vinculando corretora a tomador com seguradora', async () => {
    fetchMock.mockResolvedValueOnce({
      id: 'appt1',
      brokerageId: 'brokerage1',
      brokerageName: 'Corretora X',
      brokerageDocumentNumber: '11222333000181',
      insurerId: 'insurer1',
      insurerName: 'Seguradora Y',
      insurerDocumentNumber: '12345678000195',
      status: 'Active',
      startedAt: '2026-07-20T10:00:00Z',
      endedAt: null,
    })

    const { createAppointment } = usePolicyHolders(api)
    const result = await createAppointment('policy-holder-1', {
      brokerageId: 'brokerage1',
      insurerId: 'insurer1',
    })

    expect(fetchMock).toHaveBeenCalledWith('/api/policy-holders/policy-holder-1/appointments', {
      method: 'POST',
      body: {
        brokerageId: 'brokerage1',
        insurerId: 'insurer1',
      },
    })
    expect(result.status).toBe('Active')
    expect(result.endedAt).toBeNull()
  })

  it('encerra nomeação vigente sem substituta', async () => {
    fetchMock.mockResolvedValueOnce({
      id: 'appt1',
      brokerageId: 'brokerage1',
      brokerageName: 'Corretora X',
      brokerageDocumentNumber: '11222333000181',
      insurerId: 'insurer1',
      insurerName: 'Seguradora Y',
      insurerDocumentNumber: '12345678000195',
      status: 'Closed',
      startedAt: '2026-01-01T00:00:00Z',
      endedAt: '2026-07-20T10:00:00Z',
    })

    const { endAppointment } = usePolicyHolders(api)
    const result = await endAppointment('policy-holder-1', 'appt1')

    expect(fetchMock).toHaveBeenCalledWith('/api/policy-holders/policy-holder-1/appointments/appt1/end', {
      method: 'PATCH',
    })
    expect(result.status).toBe('Closed')
    expect(result.endedAt).not.toBeNull()
  })

  it('substituição de nomeação atomicamente no backend (POST com vigente diferente)', async () => {
    // RN-028: ao nomear outra corretora para par Tomador×Seguradora com vigente,
    // backend encerra a vigente e cria a nova na mesma operação
    fetchMock.mockResolvedValueOnce({
      id: 'appt2',
      brokerageId: 'brokerage2',
      brokerageName: 'Corretora Z',
      brokerageDocumentNumber: '99999999000181',
      insurerId: 'insurer1',
      insurerName: 'Seguradora Y',
      insurerDocumentNumber: '12345678000195',
      status: 'Active',
      startedAt: '2026-07-20T10:00:00Z',
      endedAt: null,
    })

    const { createAppointment } = usePolicyHolders(api)
    const result = await createAppointment('policy-holder-1', {
      brokerageId: 'brokerage2',
      insurerId: 'insurer1',
    })

    // POST único, não dois (end + create)
    expect(fetchMock).toHaveBeenCalledOnce()
    expect(fetchMock).toHaveBeenCalledWith('/api/policy-holders/policy-holder-1/appointments', {
      method: 'POST',
      body: {
        brokerageId: 'brokerage2',
        insurerId: 'insurer1',
      },
    })
    expect(result.brokerageId).toBe('brokerage2')
    expect(result.status).toBe('Active')
  })
})
