/**
 * Ramo (SuretyBranch) — enum de domínio exposto por nome estável no contrato (RN-035/RN-036):
 * `Public` / `Private`. Renderizado pelo nome estável, nunca por posição ordinal (ADR-004);
 * label pt-BR do glossário ("Setor Público"/"Setor Privado") num único mapa. A disponibilidade
 * da Modalidade por Ramo é derivada no servidor (RN-036), nunca digitada no cliente.
 */
export const suretyBranches = {
  public: 'Public',
  private: 'Private',
} as const

export type SuretyBranch = typeof suretyBranches[keyof typeof suretyBranches]

type SuretyBranchView = {
  label: string
  color: string
  known: boolean
}

const suretyBranchViews = {
  [suretyBranches.public]: { label: 'Setor Público', color: 'info' },
  [suretyBranches.private]: { label: 'Setor Privado', color: 'secondary' },
} as const satisfies Record<SuretyBranch, Omit<SuretyBranchView, 'known'>>

export function isSuretyBranch(branch: string | null | undefined): branch is SuretyBranch {
  return branch === suretyBranches.public || branch === suretyBranches.private
}

export function getSuretyBranchView(branch: string | null | undefined): SuretyBranchView {
  if (!isSuretyBranch(branch)) {
    // Ramo desconhecido não quebra a tela: mostra o nome cru como veio do contrato.
    return { label: branch ?? 'Ramo desconhecido', color: 'warning', known: false }
  }

  return {
    ...suretyBranchViews[branch],
    known: true,
  }
}
