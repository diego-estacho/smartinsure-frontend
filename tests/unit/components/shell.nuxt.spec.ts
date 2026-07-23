// @vitest-environment nuxt
import { describe, it, expect, beforeEach } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import shell from '~/layouts/shell.vue'
import { useShellPreferences } from '~/composables/useShellPreferences'
import { useWorkspaces } from '~/composables/useWorkspaces'

/** Força o desktop (>=1024) para o drawer nascer permanente e visível (exec-plan 0014). */
function forceDesktopViewport() {
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1280 })
  window.dispatchEvent(new Event('resize'))
}

describe('useWorkspaces — placeholder OPEN-03 (moldura visual, sem inventar dado)', () => {
  it('nasce vazio: sem corretoras, sem ativa', () => {
    const { workspaces, activeWorkspace, hasWorkspaces } = useWorkspaces()
    expect(workspaces.value).toEqual([])
    expect(activeWorkspace.value).toBeNull()
    expect(hasWorkspaces.value).toBe(false)
  })

  it('selectWorkspace é no-op enquanto a lista é vazia (bloqueado por OPEN-03)', () => {
    const { activeWorkspace, selectWorkspace } = useWorkspaces()
    selectWorkspace('qualquer-id')
    expect(activeWorkspace.value).toBeNull()
  })
})

describe('useShellPreferences — rail persistido em localStorage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('setCollapsed reflete no ref e persiste (1/0)', () => {
    const { collapsed, setCollapsed } = useShellPreferences()
    setCollapsed(true)
    expect(collapsed.value).toBe(true)
    expect(localStorage.getItem('si-shell-collapsed')).toBe('1')
    setCollapsed(false)
    expect(collapsed.value).toBe(false)
    expect(localStorage.getItem('si-shell-collapsed')).toBe('0')
  })

  it('toggleCollapsed inverte o estado', () => {
    const { collapsed, setCollapsed, toggleCollapsed } = useShellPreferences()
    setCollapsed(false)
    toggleCollapsed()
    expect(collapsed.value).toBe(true)
  })

  it('loadCollapsed lê a preferência salva no mount', () => {
    const { collapsed, setCollapsed, loadCollapsed } = useShellPreferences()
    setCollapsed(false)
    // Simula uma preferência já persistida (diferente do estado atual) e recarrega.
    localStorage.setItem('si-shell-collapsed', '1')
    loadCollapsed()
    expect(collapsed.value).toBe(true)
  })
})

describe('Layout shell — menu de navegação (exec-plan 0014)', () => {
  beforeEach(() => {
    // Estado expandido conhecido: `collapsed` é useState compartilhado entre os testes
    // do arquivo; sem reset, um teste anterior poderia deixar o shell em rail.
    useShellPreferences().setCollapsed(false)
    forceDesktopViewport()
  })

  it('renderiza os 9 destinos do protótipo e não mostra o antigo "Página B"', async () => {
    const w = await mountSuspended(shell, { slots: { default: () => 'conteúdo' } })
    const text = w.text()
    for (const label of [
      'Painel', 'Cotações', 'Apólices', 'Tomadores', 'Corretoras',
      'Usuários', 'Perfis de acesso', 'Relatórios', 'Configurações',
    ]) {
      expect(text).toContain(label)
    }
    expect(text).not.toContain('Página B')
  })

  it('itens com rota navegam; itens sem rota ficam desabilitados', async () => {
    const w = await mountSuspended(shell, { slots: { default: () => 'x' } })
    const items = w.findAll('.si-shell-nav-item')
    const painel = items.find(i => i.text().includes('Painel'))
    const cotacoes = items.find(i => i.text().includes('Cotações'))
    expect(painel).toBeTruthy()
    expect(cotacoes).toBeTruthy()
    expect(painel!.classes()).not.toContain('v-list-item--disabled')
    expect(cotacoes!.classes()).toContain('v-list-item--disabled')
  })

  it('mostra o grupo "Operação", o switcher e a conta neutra (sem identidade real)', async () => {
    const w = await mountSuspended(shell, { slots: { default: () => 'x' } })
    const text = w.text()
    expect(text).toContain('Operação')
    expect(text).toContain('Trocar corretora')
    expect(text).toContain('Minha conta')
  })
})
