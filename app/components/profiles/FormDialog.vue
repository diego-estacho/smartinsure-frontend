<script setup lang="ts">
/**
 * RN-069/RN-070/RN-074 — criação e edição de Perfil customizado do escopo ativo.
 * Apresentacional (ADR-018): coleta nome e as permissões marcadas do catálogo fixo (RN-063) e
 * emite `confirm`; a página chama o composable. Nome único no escopo, permissão fora do catálogo
 * e autorização são decisão do servidor — aqui só se valida forma.
 * O catálogo vem de `/api/permissions`; perfil sem permissão é válido (RN-062).
 */
import type { Permission } from '~/composables/useProfiles'
import { describeRequestError } from '~/lib/errors'
import { required } from '~/lib/rules'

const open = defineModel<boolean>({ required: true })

const props = defineProps<{
  /** Perfil em edição; nulo = criação. */
  profile: { id: string, name: string, permissionCodes: string[] } | null
  submitting?: boolean
  /**
   * RN-073: perfil fixo tem nome e escopo imutáveis — o Administrador do Sistema edita só as
   * permissões, e a mudança vale globalmente.
   */
  fixedProfile?: boolean
}>()

const emit = defineEmits<{
  confirm: [payload: { name: string, permissionCodes: string[] }]
}>()

const { listPermissions } = useProfiles()

const name = ref('')
const selectedCodes = ref<string[]>([])
const permissions = ref<Permission[]>([])
const loading = ref(false)
const loadError = ref<string | null>(null)
const formValid = ref(false)

const isEditing = computed(() => Boolean(props.profile))
const title = computed(() => {
  if (props.fixedProfile) {
    return 'Editar permissões do perfil fixo'
  }

  return isEditing.value ? 'Editar perfil' : 'Novo perfil'
})

const hint = computed(() => props.fixedProfile
  ? 'Perfil fixo da plataforma: nome e escopo não mudam. As permissões marcadas aqui valem para todos os usuários com este perfil, em qualquer corretora ou tomador.'
  : 'O perfil vale apenas no escopo em que você está operando e passa a ser oferecido na criação de usuários dele. Perfil sem nenhuma permissão é válido — só não autoriza operação alguma.')

// Perfil fixo não tem nome editável; a validade do formulário não depende do campo.
const canSubmit = computed(() => props.fixedProfile || formValid.value)

watch(open, async (isOpen) => {
  if (!isOpen) {
    return
  }

  name.value = props.profile?.name ?? ''
  selectedCodes.value = [...(props.profile?.permissionCodes ?? [])]
  await load()
})

async function load() {
  if (permissions.value.length) {
    return
  }

  loading.value = true
  loadError.value = null

  try {
    permissions.value = await listPermissions()
  }
  catch (error) {
    loadError.value = describeRequestError(error, 'Não foi possível carregar o catálogo de permissões.')
    permissions.value = []
  }
  finally {
    loading.value = false
  }
}

function submit() {
  if (!canSubmit.value) {
    return
  }

  emit('confirm', {
    name: name.value.trim(),
    permissionCodes: [...selectedCodes.value],
  })
}
</script>

<template>
  <SiDialog
    v-model="open"
    max-width="640"
  >
    <SiCard class="si-profile-form">
      <h2 class="text-h6 mb-1">
        {{ title }}
      </h2>

      <p class="si-profile-form__hint mb-5">
        {{ hint }}
      </p>

      <SiAlert
        v-if="loadError"
        type="error"
        class="mb-4"
        :text="loadError"
      />

      <SiForm v-model="formValid">
        <SiTextField
          v-if="!fixedProfile"
          v-model="name"
          label="Nome do perfil"
          :rules="[required()]"
          class="mb-4"
        />

        <p
          v-else
          class="si-profile-form__fixed-name mb-4"
        >
          {{ name }}
        </p>

        <p class="si-profile-form__section">
          Permissões
        </p>

        <SiProgressCircular
          v-if="loading"
          indeterminate
          :size="24"
        />

        <p
          v-else-if="!permissions.length"
          class="si-profile-form__empty"
        >
          Catálogo de permissões vazio.
        </p>

        <div
          v-else
          class="si-profile-form__permissions"
        >
          <SiCheckbox
            v-for="permission in permissions"
            :key="permission.id"
            v-model="selectedCodes"
            :value="permission.code"
            :label="permission.description || permission.code"
            density="compact"
            hide-details
          />
        </div>
      </SiForm>

      <div class="si-profile-form__actions">
        <SiButton
          variant="text"
          size="small"
          @click="open = false"
        >
          Cancelar
        </SiButton>

        <SiButton
          :prepend-icon="'check'"
          :loading="props.submitting"
          :disabled="!canSubmit"
          size="small"
          @click="submit"
        >
          {{ isEditing ? 'Salvar' : 'Criar perfil' }}
        </SiButton>
      </div>
    </SiCard>
  </SiDialog>
</template>

<style scoped>
.si-profile-form {
  padding: var(--si-space-5);
}

.si-profile-form__hint {
  color: var(--si-cinza);
  font-size: var(--si-fs-body-2);
}

.si-profile-form__fixed-name {
  margin: 0;
  font-weight: var(--si-font-weight-semibold);
}

.si-profile-form__section {
  font-size: var(--si-fs-small);
  font-weight: var(--si-font-weight-semibold);
  margin-bottom: var(--si-space-2);
}

.si-profile-form__empty {
  margin: 0;
  color: var(--si-cinza);
  font-size: var(--si-fs-body-2);
}

/* Catálogo pode crescer: rola dentro do próprio bloco, sem esticar o dialog. */
.si-profile-form__permissions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--si-space-1) var(--si-space-4);
  max-height: 280px;
  overflow-y: auto;
}

.si-profile-form__actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--si-space-2);
  margin-top: var(--si-space-5);
}

@media (max-width: 700px) {
  .si-profile-form__permissions {
    grid-template-columns: 1fr;
  }
}
</style>
