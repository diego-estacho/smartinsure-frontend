/**
 * Escopo do Perfil (RN-062): Sistema, Corretora ou Tomador. Rótulo e cor num único mapa
 * por domínio (ADR-004), sempre pelo nome estável do contrato — nunca por posição.
 */
export const profileScopes = {
  system: 'System',
  brokerage: 'Brokerage',
  policyHolder: 'PolicyHolder',
} as const

export type ProfileScope = typeof profileScopes[keyof typeof profileScopes]

type ProfileScopeView = {
  label: string
  color: string
  known: boolean
}

const profileScopeViews = {
  [profileScopes.system]: { label: 'Sistema', color: 'primary' },
  [profileScopes.brokerage]: { label: 'Corretora', color: 'info' },
  [profileScopes.policyHolder]: { label: 'Tomador', color: 'secondary' },
} as const satisfies Record<ProfileScope, Omit<ProfileScopeView, 'known'>>

export function isProfileScope(scope: string | null | undefined): scope is ProfileScope {
  return scope === profileScopes.system
    || scope === profileScopes.brokerage
    || scope === profileScopes.policyHolder
}

export function getProfileScopeView(scope: string | null | undefined): ProfileScopeView {
  if (!isProfileScope(scope)) {
    return { label: 'Desconhecido', color: 'warning', known: false }
  }

  return { ...profileScopeViews[scope], known: true }
}

/** Filtro de Escopo da listagem: `value: null` = todos. */
export const profileScopeOptions = [
  { title: 'Todos', value: null },
  { title: 'Sistema', value: profileScopes.system },
  { title: 'Corretora', value: profileScopes.brokerage },
  { title: 'Tomador', value: profileScopes.policyHolder },
] as const

/**
 * Nome técnico do Perfil fixo → rótulo em português. Os nomes técnicos dos Perfis fixos
 * Corretor e Tomador seguem em aberto (OPEN-17), por isso não têm entrada aqui: Perfil
 * fora do mapa é exibido pelo próprio nome, sem inventar rótulo.
 */
const fixedProfileLabels: Record<string, string> = {
  SystemAdministrator: 'Administrador do Sistema',
  BrokerageAdministrator: 'Corretor Administrador',
  PolicyHolderAdministrator: 'Tomador Administrador',
}

export function getProfileLabel(name: string | null | undefined): string {
  if (!name) {
    return '-'
  }

  return fixedProfileLabels[name] ?? name
}
