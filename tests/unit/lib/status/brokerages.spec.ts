import { describe, expect, it } from 'vitest'
import {
  brokerageSectorOptions,
  brokerageSituationTabs,
  brokerageStatusOptions,
  calculationEngineOptions,
  getBrokerageSituationAction,
  getBrokerageSituationView,
  getBrokerageStatusAction,
  getBrokerageStatusView,
  isBrokerageStatus,
} from '~/lib/status/brokerages'

/**
 * Lógica de apresentação da Corretora — mapa único de situação/ação (RN-018, RN-021, RN-053).
 * O status é renderizado pelo nome estável do contrato (nunca por posição ordinal); estes testes
 * blindam esse mapa contra regressão silenciosa (troca de rótulo, cor ou alvo de transição).
 */

describe('RN-053 · situação apresentada da corretora (derivada no servidor)', () => {
  it('Active → "Ativa" em verde e reconhecida', () => {
    expect(getBrokerageSituationView('Active')).toEqual({ label: 'Ativa', color: 'success', known: true })
  })

  it('Incomplete → "Incompleta" em amarelo (cadastro a completar)', () => {
    expect(getBrokerageSituationView('Incomplete')).toEqual({ label: 'Incompleta', color: 'warning', known: true })
  })

  it('Inactive → "Inativa" em cinza', () => {
    expect(getBrokerageSituationView('Inactive')).toEqual({ label: 'Inativa', color: 'secondary', known: true })
  })

  it('valor desconhecido do contrato não quebra a tela — cai em "Desconhecida" e known=false', () => {
    for (const unknown of ['Pending', '', null, undefined]) {
      const view = getBrokerageSituationView(unknown)
      expect(view.known).toBe(false)
      expect(view.label).toBe('Desconhecida')
    }
  })
})

describe('RN-021 · ação de ativar/inativar deriva da situação', () => {
  it('Inativa → ação Ativar, alvo de status Active, texto de confirmação de retorno à cotação', () => {
    const action = getBrokerageSituationAction('Inactive')
    expect(action.targetStatus).toBe('Active')
    expect(action.label).toBe('Ativar corretora')
    expect(action.color).toBe('primary')
    expect(action.successMessage).toBe('Corretora ativada.')
    expect(action.confirmTitle).toBe('Ativar corretora')
  })

  it('Ativa → ação Inativar, alvo de status Inactive, aviso de perda de acesso', () => {
    const action = getBrokerageSituationAction('Active')
    expect(action.targetStatus).toBe('Inactive')
    expect(action.label).toBe('Inativar corretora')
    expect(action.color).toBe('error')
    expect(action.successMessage).toBe('Corretora inativada.')
    expect(action.confirmText).toContain('deixa de aparecer para cotação')
  })

  it('Incompleta também pode ser inativada (não é Inativa) → alvo Inactive', () => {
    expect(getBrokerageSituationAction('Incomplete').targetStatus).toBe('Inactive')
  })

  it('situação ausente/desconhecida assume o caminho seguro de inativar', () => {
    expect(getBrokerageSituationAction(null).targetStatus).toBe('Inactive')
    expect(getBrokerageSituationAction(undefined).label).toBe('Inativar corretora')
  })
})

describe('RN-018 · abas e filtros da listagem', () => {
  it('as abas de situação são Todas/Ativas/Incompletas/Inativas, com Todas neutra (value null)', () => {
    expect(brokerageSituationTabs.map(t => t.key)).toEqual(['all', 'active', 'incomplete', 'inactive'])
    expect(brokerageSituationTabs.map(t => t.label)).toEqual(['Todas', 'Ativas', 'Incompletas', 'Inativas'])
    expect(brokerageSituationTabs[0]).toMatchObject({ value: null })
    expect(brokerageSituationTabs[1]).toMatchObject({ value: 'Active' })
  })

  it('cada aba mapeia 1:1 para uma chave de contagem do envelope da listagem', () => {
    const countKeys = brokerageSituationTabs.map(t => t.key)
    expect(new Set(countKeys).size).toBe(countKeys.length)
    expect(countKeys).toContain('incomplete')
  })

  it('o filtro de setor abre em "Todos" (value null) e oferece Privado/Público', () => {
    expect(brokerageSectorOptions[0]).toEqual({ title: 'Todos', value: null })
    const values = brokerageSectorOptions.map(o => o.value)
    expect(values).toContain('Private')
    expect(values).toContain('Public')
  })

  it('o filtro de motor abre em "Todos" e inclui PlugV2 (único motor desta fase)', () => {
    expect(calculationEngineOptions[0]).toEqual({ title: 'Todos', value: null })
    expect(calculationEngineOptions.map(o => o.value)).toContain('PlugV2')
  })
})

describe('status armazenado da corretora (Active/Inactive) — helpers legados de apoio', () => {
  it('isBrokerageStatus só aceita os dois estados de armazenamento — "Incomplete" é situação, não status', () => {
    expect(isBrokerageStatus('Active')).toBe(true)
    expect(isBrokerageStatus('Inactive')).toBe(true)
    expect(isBrokerageStatus('Incomplete')).toBe(false)
    expect(isBrokerageStatus(null)).toBe(false)
  })

  it('getBrokerageStatusView mapeia Ativa/Inativa e degrada com segurança no desconhecido', () => {
    expect(getBrokerageStatusView('Active')).toMatchObject({ label: 'Ativa', color: 'success', known: true })
    expect(getBrokerageStatusView('Inactive')).toMatchObject({ label: 'Inativa', color: 'error', known: true })
    expect(getBrokerageStatusView('???')).toMatchObject({ known: false })
  })

  it('getBrokerageStatusAction inverte o status e desabilita a ação no desconhecido', () => {
    expect(getBrokerageStatusAction('Active').targetStatus).toBe('Inactive')
    expect(getBrokerageStatusAction('Inactive').targetStatus).toBe('Active')
    expect(getBrokerageStatusAction(null)).toMatchObject({ targetStatus: null, disabled: true })
  })

  it('as opções do filtro legado de status começam em "Todas" (value null)', () => {
    expect(brokerageStatusOptions[0]).toEqual({ title: 'Todas', value: null })
  })
})
