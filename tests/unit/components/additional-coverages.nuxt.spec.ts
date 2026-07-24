// @vitest-environment nuxt
import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'

import Matrix from '~/components/additionalCoverageMap/Matrix.vue'
import PendingQueue from '~/components/additionalCoverageMap/PendingQueue.vue'

const canonical = {
  id: 'c-1',
  name: 'Multa',
  status: 'Active',
  linked: [
    {
      importedCoverageId: 'i-1',
      insurerName: 'Seguradora Alfa',
      modalityName: 'Fiança locatícia',
      coverageName: 'Multa Contratual',
    },
  ],
}

const inactive = {
  id: 'c-2',
  name: 'Trabalhista',
  status: 'Inactive',
  linked: [],
}

const pending = {
  id: 'p-1',
  importedModalityId: 'im-1',
  insurerName: 'Seguradora Beta',
  modalityName: 'Fiança comercial',
  coverageName: 'Danos ao Imóvel',
}

function buttonByText(w: { findAll: (s: string) => { text: () => string, trigger: (e: string) => Promise<void> }[] }, label: string) {
  return w.findAll('button').find(b => b.text().includes(label))
}

describe('RN-040/RN-046 Matrix — catálogo canônico com Importadas vinculadas', () => {
  it('renderiza o nome, a situação pelo nome estável e a Importada vinculada', async () => {
    const w = await mountSuspended(Matrix, { props: { coverages: [canonical, inactive] } })
    const text = w.text()
    expect(text).toContain('Multa')
    // Situação por nome estável (ADR-004): Active → Ativa, Inactive → Inativa.
    expect(text).toContain('Ativa')
    expect(text).toContain('Inativa')
    // Importada vinculada (RN-043) visível.
    expect(text).toContain('Multa Contratual')
    expect(text).toContain('Seguradora Alfa')
    // Canônica sem vínculo evidencia a ausência.
    expect(text).toContain('Nenhuma Cobertura Adicional Importada vinculada')
  })

  it('emite edit, change-status e unlink pelas ações da linha', async () => {
    const w = await mountSuspended(Matrix, { props: { coverages: [canonical] } })

    await buttonByText(w, 'Editar')!.trigger('click')
    expect(w.emitted('edit')?.[0]).toEqual([canonical])

    await buttonByText(w, 'Inativar')!.trigger('click')
    expect(w.emitted('change-status')?.[0]).toEqual([canonical])

    await buttonByText(w, 'Desvincular')!.trigger('click')
    expect(w.emitted('unlink')?.[0]).toEqual([canonical.linked[0]])
  })
})

describe('RN-043 PendingQueue — pendências de mapeamento', () => {
  it('renderiza a Cobertura Adicional Importada pendente (origem, Seguradora, Modalidade)', async () => {
    const w = await mountSuspended(PendingQueue, { props: { items: [pending] } })
    const text = w.text()
    expect(text).toContain('Danos ao Imóvel')
    expect(text).toContain('Seguradora Beta')
    expect(text).toContain('Fiança comercial')
  })

  it('emite link, ignore e restore pelas ações', async () => {
    const w = await mountSuspended(PendingQueue, { props: { items: [pending] } })

    await buttonByText(w, 'Vincular')!.trigger('click')
    expect(w.emitted('link')?.[0]).toEqual([pending])

    await buttonByText(w, 'Ignorar')!.trigger('click')
    expect(w.emitted('ignore')?.[0]).toEqual([pending])

    await buttonByText(w, 'Reativar')!.trigger('click')
    expect(w.emitted('restore')?.[0]).toEqual([pending])
  })

  it('mostra o estado vazio quando não há pendências', async () => {
    const w = await mountSuspended(PendingQueue, { props: { items: [] } })
    expect(w.text()).toContain('Nenhuma Cobertura Adicional Importada pendente de mapeamento')
  })
})
