/**
 * Seletor de corretora (workspace switcher) — MOLDURA VISUAL apenas (exec-plan 0014).
 *
 * O vínculo Usuário↔Corretora e a "corretora ativa" da sessão dependem de contrato do
 * backend e estão BLOQUEADOS por **OPEN-03** (`../smartinsure-backend/docs/product-specs/
 * open-decisions.md`). Enquanto a decisão de produto não existir, este composable **não
 * inventa** corretoras/CNPJs: devolve lista vazia e ativa nula, e a UI do switcher renderiza
 * a estrutura (botão + popover) com um estado vazio honesto.
 *
 * Quando OPEN-03 fechar, troca-se este placeholder por consumo do BFF (ADR-008) — a UI do
 * shell não muda.
 */
export interface Workspace {
  id: string
  /** Razão social / nome da corretora. */
  name: string
  /** CNPJ formatado (ex.: 12.345.678/0001-90). */
  document: string
}

export function useWorkspaces() {
  // Bloqueado por OPEN-03: sem dado real disponível, e sem inventar dado.
  const workspaces = useState<Workspace[]>('si-workspaces', () => [])
  const activeWorkspaceId = useState<string | null>('si-active-workspace', () => null)

  const activeWorkspace = computed<Workspace | null>(
    () => workspaces.value.find(w => w.id === activeWorkspaceId.value) ?? null,
  )
  const hasWorkspaces = computed(() => workspaces.value.length > 0)

  /** Define a corretora ativa. No-op enquanto a lista é vazia (OPEN-03). */
  function selectWorkspace(id: string): void {
    if (workspaces.value.some(w => w.id === id)) activeWorkspaceId.value = id
  }

  return { workspaces, activeWorkspace, hasWorkspaces, selectWorkspace }
}
