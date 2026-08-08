/**
 * Regras de dependência e níveis por área do editor de permissões (handoff §12), como funções
 * puras sobre a lista de códigos marcados:
 * - marcar uma ação sobe a cadeia de `dependsOn` até a raiz (a leitura correspondente);
 * - desmarcar uma leitura derruba, em cascata, tudo que depende dela (inclusive entre áreas, se
 *   houver dependência entre áreas no futuro);
 * - o nível de uma área (Sem acesso · Consultar · Operar) é **derivado** do que está marcado, não
 *   um modo — se o conjunto não corresponde a nenhum, é "Personalizado".
 *
 * Nada aqui autoriza operação: a autorização é por código no servidor (RN-063). Estas funções só
 * compõem a seleção que o usuário vê, e são compartilhadas entre a tela de Perfis e o atalho de
 * criação de perfil no convite de usuário (§13), para os dois falarem a mesma língua.
 */
import type { CatalogArea, PermissionCatalog } from './catalog'

export type AreaLevel = 'none' | 'view' | 'operate' | 'custom'

/** Leituras da área: as permissões sem `dependsOn`. */
export function readOnlyCodes(area: CatalogArea): string[] {
  return area.permissions.filter(permission => permission.dependsOn === null).map(permission => permission.code)
}

/** Devolve os códigos marcados em ordem estável (a do catálogo), para saída determinística. */
function materialize(selected: Set<string>, catalog: PermissionCatalog): string[] {
  const ordered = [...catalog.byCode.keys()].filter(code => selected.has(code))
  const extras = [...selected].filter(code => !catalog.byCode.has(code))
  return [...ordered, ...extras]
}

/** Remove, em cascata, todo código cuja dependência não esteja mais marcada. */
function cascade(selected: Set<string>, catalog: PermissionCatalog): void {
  let changed = true
  while (changed) {
    changed = false
    for (const code of [...selected]) {
      const dependsOn = catalog.byCode.get(code)?.dependsOn
      if (dependsOn && !selected.has(dependsOn)) {
        selected.delete(code)
        changed = true
      }
    }
  }
}

/** Marca `code` e sobe a cadeia de `dependsOn` até a raiz (idempotente). */
export function addPerm(selected: readonly string[], code: string, catalog: PermissionCatalog): string[] {
  const next = new Set(selected)
  const seen = new Set<string>()
  let current: string | null | undefined = code
  while (current && !seen.has(current)) {
    seen.add(current)
    next.add(current)
    current = catalog.byCode.get(current)?.dependsOn
  }
  return materialize(next, catalog)
}

/** Desmarca `code` e roda a cascata (derruba dependentes órfãos). */
export function removePerm(selected: readonly string[], code: string, catalog: PermissionCatalog): string[] {
  const next = new Set(selected)
  next.delete(code)
  cascade(next, catalog)
  return materialize(next, catalog)
}

/** Alterna `code`: marca (subindo dependências) ou desmarca (com cascata). */
export function togglePerm(selected: readonly string[], code: string, catalog: PermissionCatalog): string[] {
  return selected.includes(code)
    ? removePerm(selected, code, catalog)
    : addPerm(selected, code, catalog)
}

/** Nível derivado da área a partir do que está marcado. */
export function levelOf(area: CatalogArea, selected: readonly string[]): AreaLevel {
  const codes = area.permissions.map(permission => permission.code)
  const on = codes.filter(code => selected.includes(code))

  if (on.length === 0) {
    return 'none'
  }
  if (on.length === codes.length) {
    return 'operate'
  }

  const reads = readOnlyCodes(area)
  if (on.length === reads.length && reads.every(code => selected.includes(code))) {
    return 'view'
  }

  return 'custom'
}

/**
 * Aplica um nível à área inteira: limpa a área e recompõe conforme o nível (leituras em "Consultar",
 * tudo em "Operar"), rodando a cascata ao fim (para eventuais dependências entre áreas).
 */
export function setAreaLevel(
  area: CatalogArea,
  level: AreaLevel,
  selected: readonly string[],
  catalog: PermissionCatalog,
): string[] {
  const areaCodes = new Set(area.permissions.map(permission => permission.code))
  let result = [...selected].filter(code => !areaCodes.has(code))

  const targets = level === 'operate'
    ? area.permissions.map(permission => permission.code)
    : level === 'view'
      ? readOnlyCodes(area)
      : []

  for (const code of targets) {
    result = addPerm(result, code, catalog)
  }

  const finalSet = new Set(result)
  cascade(finalSet, catalog)
  return materialize(finalSet, catalog)
}

/** Resumo do cabeçalho da área: nível + "N de M". */
export function areaSummary(
  area: CatalogArea,
  selected: readonly string[],
): { level: AreaLevel, on: number, total: number } {
  const total = area.permissions.length
  const on = area.permissions.filter(permission => selected.includes(permission.code)).length
  return { level: levelOf(area, selected), on, total }
}
