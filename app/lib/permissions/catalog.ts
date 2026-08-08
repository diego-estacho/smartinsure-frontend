/**
 * Catálogo de permissões agrupado por área (RN-063, revisão 2026-08-07). O backend entrega a lista
 * plana de Permissões já com `area` (chave estável, em inglês) e `dependsOn`; aqui o front apenas
 * agrupa e decora com o rótulo pt-BR da área e a nota explicativa — texto de UI (ADR-058), nunca
 * regra. A ordem das áreas e os rótulos são de apresentação; a autorização é sempre por código no
 * servidor (RN-063). Áreas sem código declarado (ex.: Apólices, Administração da plataforma) não
 * aparecem até a funcionalidade nascer.
 */
import type { components } from '~/types/gen/api'

export type ApiPermission = components['schemas']['PermissionResponse']

export interface CatalogPermission {
  code: string
  /** Rótulo exibido — a descrição pt-BR do catálogo, ou o próprio código como fallback. */
  label: string
  /** Chave estável da área (do contrato). */
  area: string
  /** Código da leitura de que esta ação depende; `null` numa leitura. */
  dependsOn: string | null
  /** Sublinha explicativa (texto de UI); `null` quando não há. */
  note: string | null
}

export interface CatalogArea {
  key: string
  label: string
  permissions: CatalogPermission[]
}

export interface PermissionCatalog {
  areas: CatalogArea[]
  byCode: Map<string, CatalogPermission>
}

/** Rótulo pt-BR por área (chave estável do contrato → texto de UI). */
const areaLabels: Record<string, string> = {
  'quotations': 'Cotações',
  'policies': 'Apólices',
  'policy-holders': 'Tomadores',
  'brokerages': 'Corretoras',
  'credit-inquiries': 'Consulta de crédito',
  'catalog': 'Catálogo',
  'users-access': 'Usuários e acessos',
  'platform': 'Administração da plataforma',
}

/** Ordem de exibição das áreas (a do handoff §2). Áreas fora desta lista vão ao fim, por chave. */
const areaOrder = [
  'quotations',
  'policies',
  'policy-holders',
  'brokerages',
  'credit-inquiries',
  'catalog',
  'users-access',
  'platform',
]

/** Nota explicativa por código (sublinha do editor; texto de UI). */
const permissionNotes: Record<string, string> = {
  'credit-inquiries.create': 'Cada solicitação tem custo por consulta.',
  'policies.issue': 'Gera a apólice e o boleto na seguradora.',
  'profiles.manage': 'Permite conceder qualquer permissão a outras pessoas.',
}

const ungroupedArea = 'outros'

/** Agrupa a lista plana do contrato em áreas ordenadas, indexando cada código. */
export function buildCatalog(permissions: readonly ApiPermission[]): PermissionCatalog {
  const byCode = new Map<string, CatalogPermission>()
  const byArea = new Map<string, CatalogPermission[]>()

  for (const permission of permissions) {
    const area = permission.area ?? ungroupedArea
    const entry: CatalogPermission = {
      code: permission.code,
      label: permission.description ?? permission.code,
      area,
      dependsOn: permission.dependsOn ?? null,
      note: permissionNotes[permission.code] ?? null,
    }
    byCode.set(entry.code, entry)
    const bucket = byArea.get(area) ?? []
    bucket.push(entry)
    byArea.set(area, bucket)
  }

  const orderedKeys = [
    ...areaOrder.filter(key => byArea.has(key)),
    ...[...byArea.keys()].filter(key => !areaOrder.includes(key)),
  ]

  const areas: CatalogArea[] = orderedKeys.map(key => ({
    key,
    label: areaLabels[key] ?? key,
    permissions: byArea.get(key) ?? [],
  }))

  return { areas, byCode }
}

export function areaLabel(key: string): string {
  return areaLabels[key] ?? key
}
