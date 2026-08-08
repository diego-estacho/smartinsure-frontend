<script setup lang="ts">
/**
 * Editor de Perfil (handoff §8) — modal único para os modos novo · duplicar · editar · editar-fixo.
 * Apresentacional (ADR-018): coleta nome, descrição e as permissões marcadas (via `<PermissionsEditor>`)
 * e emite `confirm`; a página chama o composable. Auto-import: `<ProfilesAccessEditorDialog>`.
 *
 * Escopo: o backend deriva do contexto ativo do solicitante (RN-069/RN-070), não do corpo — por isso
 * aqui o escopo é leitura (chip), não seletor. Em `editar-fixo` (RN-073, só Administrador do Sistema)
 * nome/descrição são imutáveis; edita-se apenas as permissões, com efeito global.
 */
import type { PermissionCatalog } from '~/lib/permissions/catalog'
import { getProfileLabel, getProfileScopeView } from '~/lib/status/profiles'

export type EditorMode = 'novo' | 'duplicar' | 'editar' | 'editar-fixo'

export interface EditorProfile {
  id?: string
  name: string
  scope?: string | null
  description?: string | null
  permissionCodes: string[]
}

export interface EditorConfirmPayload {
  name: string
  description: string | null
  permissionCodes: string[]
}

const open = defineModel<boolean>({ required: true })

const props = withDefaults(defineProps<{
  mode: EditorMode
  catalog: PermissionCatalog
  profile?: EditorProfile | null
  submitting?: boolean
  error?: string | null
}>(), {
  profile: null,
  submitting: false,
  error: null,
})

const emit = defineEmits<{
  confirm: [payload: EditorConfirmPayload]
}>()

const name = ref('')
const description = ref('')
const selectedCodes = ref<string[]>([])
const edQuery = ref('')

const isFixedMode = computed(() => props.mode === 'editar-fixo')

const totalPermissions = computed(() => props.catalog.byCode.size)

const title = computed(() => {
  switch (props.mode) {
    case 'duplicar': return 'Duplicar perfil'
    case 'editar': return `Editar ${getProfileLabel(props.profile?.name)}`
    case 'editar-fixo': return `Editar permissões — ${getProfileLabel(props.profile?.name)}`
    default: return 'Novo perfil'
  }
})

const scopeView = computed(() => getProfileScopeView(props.profile?.scope))

const canSubmit = computed(() => isFixedMode.value || name.value.trim().length > 0)

const footerNote = computed(() => {
  if (props.error) {
    return { text: props.error, tone: 'error' as const }
  }
  if (selectedCodes.value.length === 0) {
    return { text: 'Um perfil sem permissão é válido, mas não autoriza operação alguma.', tone: 'muted' as const }
  }
  return { text: 'O perfil só é salvo quando você confirmar.', tone: 'muted' as const }
})

const submitLabel = computed(() => (props.mode === 'novo' || props.mode === 'duplicar')
  ? 'Criar perfil'
  : 'Salvar alterações')

watch(open, (isOpen) => {
  if (!isOpen) {
    return
  }
  const base = props.profile
  name.value = props.mode === 'duplicar'
    ? `${getProfileLabel(base?.name)} (cópia)`
    : (base ? getProfileLabel(base.name) : '')
  description.value = base?.description ?? ''
  selectedCodes.value = [...(base?.permissionCodes ?? [])]
  edQuery.value = ''
})

function clearAll(): void {
  selectedCodes.value = []
}

function submit(): void {
  if (!canSubmit.value) {
    return
  }
  emit('confirm', {
    name: name.value.trim(),
    description: description.value.trim() ? description.value.trim() : null,
    permissionCodes: [...selectedCodes.value],
  })
}
</script>

<template>
  <SiDialog
    v-model="open"
    :max-width="860"
  >
    <SiCard class="si-profile-editor">
      <div class="si-profile-editor__head">
        <div>
          <h2 class="text-h6 mb-1">
            {{ title }}
          </h2>
          <p class="si-profile-editor__hint">
            Ajuste a área inteira em Sem acesso · Consultar · Operar, ou marque permissão a permissão.
            Marcar uma ação de escrita ativa a consulta correspondente automaticamente.
          </p>
        </div>
        <SiChip
          v-if="scopeView.known"
          size="small"
          :color="scopeView.color"
        >
          {{ scopeView.label }}
        </SiChip>
      </div>

      <div class="si-profile-editor__fields">
        <SiTextField
          v-model="name"
          label="Nome do perfil"
          placeholder="Ex.: Operador de cotações"
          :disabled="isFixedMode"
          :required="!isFixedMode"
          hide-details
        />
        <SiTextarea
          v-model="description"
          label="Descrição"
          placeholder="Aparece na listagem e na hora de escolher o perfil de um usuário."
          :disabled="isFixedMode"
          rows="2"
          auto-grow
          hide-details
        />
      </div>

      <div class="si-profile-editor__perms">
        <div class="si-profile-editor__perms-bar">
          <SiTextField
            v-model="edQuery"
            placeholder="Filtrar permissões"
            :prepend-inner-icon="'search'"
            density="compact"
            hide-details
            clearable
            class="si-profile-editor__filter"
          />
          <span class="si-profile-editor__count">
            {{ selectedCodes.length }} de {{ totalPermissions }} permissões
          </span>
          <SiButton
            variant="text"
            size="small"
            :disabled="selectedCodes.length === 0"
            @click="clearAll"
          >
            Desmarcar tudo
          </SiButton>
        </div>

        <div class="si-profile-editor__perms-list">
          <PermissionsEditor
            v-model="selectedCodes"
            :catalog="catalog"
            :filter-text="edQuery"
          />
        </div>
      </div>

      <div class="si-profile-editor__footer">
        <p
          class="si-profile-editor__note"
          :class="{ 'si-profile-editor__note--error': footerNote.tone === 'error' }"
        >
          {{ footerNote.text }}
        </p>
        <div class="si-profile-editor__actions">
          <SiButton
            variant="text"
            size="small"
            @click="open = false"
          >
            Cancelar
          </SiButton>
          <SiButton
            :prepend-icon="'check'"
            :loading="submitting"
            :disabled="!canSubmit"
            size="small"
            @click="submit"
          >
            {{ submitLabel }}
          </SiButton>
        </div>
      </div>
    </SiCard>
  </SiDialog>
</template>

<style scoped>
.si-profile-editor {
  padding: var(--si-space-5);
}

.si-profile-editor__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--si-space-3);
  margin-bottom: var(--si-space-4);
}

.si-profile-editor__hint {
  margin: 0;
  color: var(--si-cinza);
  font-size: var(--si-fs-body-2, 13px);
  max-width: 620px;
}

.si-profile-editor__fields {
  display: grid;
  grid-template-columns: minmax(220px, 1fr);
  gap: var(--si-space-3);
  margin-bottom: var(--si-space-4);
}

.si-profile-editor__perms {
  border: 1px solid var(--si-cinza-claro);
  border-radius: var(--si-radius-lg);
  overflow: hidden;
}

.si-profile-editor__perms-bar {
  display: flex;
  align-items: center;
  gap: var(--si-space-3);
  flex-wrap: wrap;
  padding: 12px 16px;
  background: rgb(var(--v-theme-background));
  border-bottom: 1px solid var(--si-cinza-claro);
}

.si-profile-editor__filter {
  flex: 1;
  min-width: 220px;
}

.si-profile-editor__count {
  font-size: 12.5px;
  font-weight: var(--si-font-weight-semibold);
  color: var(--si-cinza);
}

.si-profile-editor__perms-list {
  max-height: 380px;
  overflow-y: auto;
}

.si-profile-editor__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--si-space-3);
  flex-wrap: wrap;
  margin-top: var(--si-space-4);
}

.si-profile-editor__note {
  margin: 0;
  font-size: 12.5px;
  color: var(--si-cinza);
  flex: 1;
  min-width: 200px;
}

.si-profile-editor__note--error {
  color: var(--si-danger-strong);
}

.si-profile-editor__actions {
  display: flex;
  align-items: center;
  gap: var(--si-space-2);
}

@media (max-width: 1023px) {
  .si-profile-editor__perms-list {
    max-height: 46vh;
  }
}
</style>
