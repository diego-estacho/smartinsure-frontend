<script setup lang="ts">
/**
 * Editor de permissões (handoff §2/§3/§8) — o coração da tela de Perfis, compartilhado com o atalho
 * de criação de perfil no convite de usuário (§13). Agrupa por área; cada área tem o controle de
 * três estados (Sem acesso · Consultar · Operar) derivado do que está marcado, mais os checkboxes.
 * Marcar uma ação de escrita liga a leitura de que ela depende; desmarcar a leitura derruba em
 * cascata (funções puras em `~/lib/permissions/rules`). Auto-import: `<PermissionsEditor>`.
 */
import type { CatalogArea, CatalogPermission, PermissionCatalog } from '~/lib/permissions/catalog'
import type { AreaLevel } from '~/lib/permissions/rules'
import type { SiSegmentedOption } from '~/components/ui/SiSegmented.vue'
import { areaSummary, levelOf, setAreaLevel, togglePerm } from '~/lib/permissions/rules'

const selected = defineModel<string[]>({ required: true })

const props = withDefaults(defineProps<{
  catalog: PermissionCatalog
  /** Filtro de texto (rótulo ou código da permissão). */
  filterText?: string
  /** Só leitura — não emite alterações. */
  readonly?: boolean
}>(), {
  filterText: '',
  readonly: false,
})

const levelOptions: SiSegmentedOption[] = [
  { value: 'none', label: 'Sem acesso' },
  { value: 'view', label: 'Consultar' },
  { value: 'operate', label: 'Operar' },
]

const normalizedFilter = computed(() => props.filterText.trim().toLowerCase())

const visibleGroups = computed(() => {
  const query = normalizedFilter.value
  return props.catalog.areas
    .map(area => ({
      area,
      permissions: query
        ? area.permissions.filter(permission =>
            permission.label.toLowerCase().includes(query)
            || permission.code.toLowerCase().includes(query))
        : area.permissions,
    }))
    .filter(group => group.permissions.length > 0)
})

const nothingMatches = computed(() => visibleGroups.value.length === 0)

function headerSummary(area: CatalogArea): string {
  const { level, on, total } = areaSummary(area, selected.value)
  return level === 'custom' ? `Personalizado · ${on} de ${total}` : `${on} de ${total} marcadas`
}

/** Nível para o segmentado: `custom` vira `null` (nenhum botão aceso). */
function levelModel(area: CatalogArea): AreaLevel | null {
  const level = levelOf(area, selected.value)
  return level === 'custom' ? null : level
}

function applyLevel(area: CatalogArea, level: string | null | undefined): void {
  if (props.readonly || level == null) {
    return
  }
  selected.value = setAreaLevel(area, level as AreaLevel, selected.value, props.catalog)
}

function toggle(code: string): void {
  if (props.readonly) {
    return
  }
  selected.value = togglePerm(selected.value, code, props.catalog)
}

function isChecked(code: string): boolean {
  return selected.value.includes(code)
}

/**
 * Sublinha da permissão: a nota do catálogo, ou — quando a dependência ainda não está marcada —
 * o aviso de que marcar liga a leitura de que ela depende.
 */
function subline(permission: CatalogPermission): string | null {
  if (permission.dependsOn && !selected.value.includes(permission.dependsOn)) {
    const dependency = props.catalog.byCode.get(permission.dependsOn)?.label ?? permission.dependsOn
    return `Marcar isto também ativa «${dependency}».`
  }
  return permission.note
}
</script>

<template>
  <div class="si-perm-editor">
    <p
      v-if="nothingMatches"
      class="si-perm-editor__empty"
    >
      Nenhuma permissão corresponde a esse filtro.
    </p>

    <section
      v-for="group in visibleGroups"
      :key="group.area.key"
      class="si-perm-editor__group"
    >
      <header class="si-perm-editor__head">
        <div class="si-perm-editor__head-text">
          <span class="si-perm-editor__area">{{ group.area.label }}</span>
          <span class="si-perm-editor__summary">{{ headerSummary(group.area) }}</span>
        </div>

        <SiSegmented
          :model-value="levelModel(group.area)"
          :options="levelOptions"
          size="compact"
          :disabled="readonly"
          :aria-label="`Nível de acesso — ${group.area.label}`"
          @update:model-value="applyLevel(group.area, $event)"
        />
      </header>

      <div class="si-perm-editor__grid">
        <SiCheckbox
          v-for="permission in group.permissions"
          :key="permission.code"
          :model-value="isChecked(permission.code)"
          :disabled="readonly"
          density="compact"
          hide-details
          class="si-perm-editor__item"
          @update:model-value="toggle(permission.code)"
        >
          <template #label>
            <span class="si-perm-editor__label">
              <span :class="['si-perm-editor__name', { 'si-perm-editor__name--on': isChecked(permission.code) }]">
                {{ permission.label }}
              </span>
              <span
                v-if="subline(permission)"
                class="si-perm-editor__note"
              >
                {{ subline(permission) }}
              </span>
            </span>
          </template>
        </SiCheckbox>
      </div>
    </section>
  </div>
</template>

<style scoped>
.si-perm-editor__empty {
  margin: 0;
  padding: 36px;
  text-align: center;
  color: var(--si-cinza);
  font-size: var(--si-fs-small);
}

.si-perm-editor__group + .si-perm-editor__group {
  border-top: 1px solid var(--si-divider);
}

/* Gotcha do handoff: sem flex-wrap + min-width no bloco de texto o cabeçalho colapsa a 0 em 390px. */
.si-perm-editor__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--si-space-3);
  flex-wrap: wrap;
  padding: 12px 16px 8px;
}

.si-perm-editor__head-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 150px;
}

.si-perm-editor__area {
  font-size: 11.5px;
  font-weight: var(--si-font-weight-semibold);
  text-transform: uppercase;
  letter-spacing: 0.09em;
  color: var(--si-cinza);
}

.si-perm-editor__summary {
  font-size: 11.5px;
  color: var(--si-border-strong);
}

.si-perm-editor__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 2px 16px;
  padding: 0 16px 10px;
}

.si-perm-editor__label {
  display: flex;
  flex-direction: column;
  gap: 1px;
  text-align: start;
}

.si-perm-editor__name {
  font-size: 13.5px;
  color: var(--si-cinza);
}

.si-perm-editor__name--on {
  color: rgb(var(--v-theme-on-surface));
  font-weight: var(--si-font-weight-semibold);
}

.si-perm-editor__note {
  font-size: 11.5px;
  color: var(--si-border-strong);
}

.si-perm-editor :deep(.si-perm-editor__item) {
  --v-selection-control-size: 34px;
}
</style>
