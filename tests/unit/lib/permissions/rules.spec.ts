import { describe, expect, it } from 'vitest'
import { buildCatalog, type ApiPermission } from '~/lib/permissions/catalog'
import { addPerm, areaSummary, levelOf, removePerm, setAreaLevel, togglePerm } from '~/lib/permissions/rules'

/**
 * Regras de dependência e níveis por área (handoff §12). Catálogo-fixture espelhando o contrato:
 * `quotations` (uma leitura + três escritas dependentes) e `users-access` (duas leituras, cada uma
 * com uma escrita dependente).
 */
function permission(code: string, area: string, dependsOn: string | null): ApiPermission {
  return { id: code, code, description: code, isSystem: true, area, dependsOn } as ApiPermission
}

const fixture: ApiPermission[] = [
  permission('quotation-groups.view', 'quotations', null),
  permission('quotation-groups.create', 'quotations', 'quotation-groups.view'),
  permission('quotation-groups.edit', 'quotations', 'quotation-groups.view'),
  permission('policies.issue', 'quotations', 'quotation-groups.view'),
  permission('users.view', 'users-access', null),
  permission('users.create', 'users-access', 'users.view'),
  permission('profiles.view', 'users-access', null),
  permission('profiles.manage', 'users-access', 'profiles.view'),
]

const catalog = buildCatalog(fixture)
const quotations = catalog.areas.find(area => area.key === 'quotations')!
const usersAccess = catalog.areas.find(area => area.key === 'users-access')!

const sorted = (codes: string[]) => [...codes].sort()

describe('buildCatalog', () => {
  it('agrupa por área na ordem do handoff e indexa por código', () => {
    expect(catalog.areas.map(area => area.key)).toEqual(['quotations', 'users-access'])
    expect(quotations.label).toBe('Cotações')
    expect(quotations.permissions).toHaveLength(4)
    expect(catalog.byCode.get('credit-inquiries.create')).toBeUndefined()
  })

  it('decora a nota de UI a partir do código', () => {
    expect(catalog.byCode.get('policies.issue')?.note).toBe('Gera a apólice e o boleto na seguradora.')
    expect(catalog.byCode.get('profiles.manage')?.note).toBe('Permite conceder qualquer permissão a outras pessoas.')
    expect(catalog.byCode.get('quotation-groups.view')?.note).toBeNull()
  })
})

describe('addPerm — marcar sobe a cadeia de dependência', () => {
  it('marcar uma escrita liga a leitura da qual depende', () => {
    expect(sorted(addPerm([], 'quotation-groups.create', catalog)))
      .toEqual(sorted(['quotation-groups.view', 'quotation-groups.create']))
  })

  it('é idempotente e mantém a cadeia', () => {
    expect(sorted(addPerm(['quotation-groups.view'], 'policies.issue', catalog)))
      .toEqual(sorted(['quotation-groups.view', 'policies.issue']))
  })
})

describe('removePerm — desmarcar a leitura derruba dependentes em cascata', () => {
  it('remover a leitura remove todas as escritas que dependem dela', () => {
    const all = ['quotation-groups.view', 'quotation-groups.create', 'quotation-groups.edit', 'policies.issue']
    expect(removePerm(all, 'quotation-groups.view', catalog)).toEqual([])
  })

  it('remover uma escrita não afeta as demais', () => {
    const before = ['quotation-groups.view', 'quotation-groups.create', 'quotation-groups.edit']
    expect(sorted(removePerm(before, 'quotation-groups.edit', catalog)))
      .toEqual(sorted(['quotation-groups.view', 'quotation-groups.create']))
  })
})

describe('togglePerm', () => {
  it('alterna marcado/desmarcado com as regras de dependência', () => {
    const on = togglePerm([], 'users.create', catalog)
    expect(sorted(on)).toEqual(sorted(['users.view', 'users.create']))
    expect(togglePerm(on, 'users.view', catalog)).toEqual([]) // cascata derruba users.create
  })
})

describe('levelOf — nível derivado', () => {
  it('nenhum / consultar / operar / personalizado', () => {
    expect(levelOf(quotations, [])).toBe('none')
    expect(levelOf(quotations, ['quotation-groups.view'])).toBe('view')
    expect(levelOf(quotations, quotations.permissions.map(p => p.code))).toBe('operate')
    expect(levelOf(quotations, ['quotation-groups.view', 'quotation-groups.create'])).toBe('custom')
  })

  it('área com duas leituras: só uma leitura marcada é personalizado, não consultar', () => {
    expect(levelOf(usersAccess, ['users.view'])).toBe('custom')
    expect(levelOf(usersAccess, ['users.view', 'profiles.view'])).toBe('view')
  })
})

describe('setAreaLevel', () => {
  it('operar marca tudo da área; consultar só as leituras; sem acesso limpa', () => {
    expect(sorted(setAreaLevel(quotations, 'operate', [], catalog)))
      .toEqual(sorted(quotations.permissions.map(p => p.code)))
    expect(setAreaLevel(quotations, 'view', [], catalog)).toEqual(['quotation-groups.view'])
    expect(setAreaLevel(quotations, 'none', ['quotation-groups.view', 'quotation-groups.create'], catalog)).toEqual([])
  })

  it('não mexe em outras áreas', () => {
    const start = ['users.view', 'profiles.view']
    const result = setAreaLevel(quotations, 'operate', start, catalog)
    expect(result).toContain('users.view')
    expect(result).toContain('profiles.view')
  })
})

describe('areaSummary', () => {
  it('devolve nível e contagem N de M', () => {
    expect(areaSummary(quotations, ['quotation-groups.view', 'quotation-groups.create']))
      .toEqual({ level: 'custom', on: 2, total: 4 })
  })
})
