<script setup lang="ts">
/**
 * Exclusão de Perfil (handoff §9) — NÃO é um erro, é um fluxo (RN-074). Sem usuários, exclusão
 * imediata. Com usuários, exige escolher o Perfil-destino (mesmo escopo) para migrar antes de
 * excluir; confirmar sem destino dispara um aviso e não exclui. Perfil fixo nunca chega aqui.
 * Apresentacional: emite `confirm({ migrateToProfileId? })`; a página chama o composable.
 * Auto-import: `<ProfilesAccessDeleteDialog>`.
 */
import { getProfileLabel } from '~/lib/status/profiles'

export interface DeleteProfileTarget {
  id: string
  name: string
  userCount: number
}

const open = defineModel<boolean>({ required: true })

const props = withDefaults(defineProps<{
  profile: DeleteProfileTarget | null
  /** Outros perfis do mesmo escopo, para migração (`{ title, value }`). */
  migrationOptions?: { title: string, value: string }[]
  submitting?: boolean
  error?: string | null
}>(), {
  migrationOptions: () => [],
  submitting: false,
  error: null,
})

const emit = defineEmits<{
  confirm: [payload: { migrateToProfileId?: string }]
}>()

const destination = ref<string | null>(null)
const warn = ref(false)

const inUse = computed(() => (props.profile?.userCount ?? 0) > 0)

watch(open, (isOpen) => {
  if (isOpen) {
    destination.value = null
    warn.value = false
  }
})

function confirm(): void {
  if (inUse.value && !destination.value) {
    warn.value = true
    return
  }
  emit('confirm', inUse.value ? { migrateToProfileId: destination.value ?? undefined } : {})
}
</script>

<template>
  <SiDialog
    v-model="open"
    :max-width="440"
  >
    <SiCard class="si-profile-delete">
      <h2 class="text-h6 mb-2">
        Excluir {{ getProfileLabel(profile?.name) }}?
      </h2>

      <p class="si-profile-delete__body">
        <template v-if="inUse">
          {{ profile?.userCount }} {{ profile?.userCount === 1 ? 'usuário usa' : 'usuários usam' }}
          este perfil hoje. Escolha para qual perfil eles devem migrar — sem isso ficariam sem
          autorização para operar.
        </template>
        <template v-else>
          Nenhum usuário usa este perfil. A exclusão é imediata e não afeta o histórico da plataforma.
        </template>
      </p>

      <SiSelect
        v-if="inUse"
        v-model="destination"
        label="Migrar usuários para"
        placeholder="Escolha um perfil do mesmo escopo"
        :items="migrationOptions"
        density="comfortable"
        hide-details
        class="mb-2"
      />

      <SiAlert
        v-if="warn"
        type="warning"
        variant="tonal"
        class="mb-2"
        text="Escolha para qual perfil migrar os usuários."
      />

      <SiAlert
        v-if="error"
        type="error"
        variant="tonal"
        class="mb-2"
        :text="error"
      />

      <div class="si-profile-delete__actions">
        <SiButton
          variant="text"
          size="small"
          @click="open = false"
        >
          Cancelar
        </SiButton>
        <SiButton
          color="error"
          :prepend-icon="'trash'"
          :loading="submitting"
          size="small"
          @click="confirm"
        >
          Excluir perfil
        </SiButton>
      </div>
    </SiCard>
  </SiDialog>
</template>

<style scoped>
.si-profile-delete {
  padding: var(--si-space-5);
}

.si-profile-delete__body {
  margin: 0 0 var(--si-space-4);
  color: var(--si-cinza);
  font-size: var(--si-fs-small);
  line-height: var(--si-lh-small);
}

.si-profile-delete__actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--si-space-2);
  margin-top: var(--si-space-3);
}
</style>
