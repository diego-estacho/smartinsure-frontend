<script setup lang="ts">
/**
 * RN-066 — convite de Corretor Administrador pelo Administrador do Sistema.
 * Apresentacional (ADR-018): coleta nome, e-mail e as Corretoras, e emite `confirm`; a chamada ao
 * backend e a decisão ficam na página/composable. O front valida apenas forma (ADR/SECURITY):
 * unicidade do e-mail, situação da Corretora e concessão do Perfil são decisão do servidor.
 * A lista oferecida traz só Corretoras na situação Ativa, porque a RN-066 recusa as demais —
 * a recusa continua sendo do servidor; aqui é só para não oferecer opção que já se sabe inválida.
 */
import type { BrokerageListItem } from '~/composables/useBrokerages'
import { formatCnpj } from '~/lib/documents'
import { email as emailRule, required } from '~/lib/rules'
import { brokerageSituations } from '~/lib/status/brokerages'

const open = defineModel<boolean>({ required: true })

const props = defineProps<{
  submitting?: boolean
}>()

const emit = defineEmits<{
  confirm: [payload: { name: string, email: string, brokerageIds: string[] }]
}>()

const { listBrokerages } = useBrokerages()

const name = ref('')
const email = ref('')
const brokerageIds = ref<string[]>([])
const brokerages = ref<BrokerageListItem[]>([])
const brokeragesLoading = ref(false)
const brokeragesError = ref<string | null>(null)
const formValid = ref(false)

const brokerageOptions = computed(() =>
  brokerages.value.map(brokerage => ({
    title: `${brokerage.name} — ${formatCnpj(brokerage.documentNumber)}`,
    value: brokerage.id,
  })),
)

// Carrega as corretoras ativas na primeira abertura e a cada reabertura (a situação pode ter mudado).
watch(open, async (isOpen) => {
  if (!isOpen) {
    return
  }

  name.value = ''
  email.value = ''
  brokerageIds.value = []
  await loadBrokerages()
})

async function loadBrokerages() {
  brokeragesLoading.value = true
  brokeragesError.value = null

  try {
    const response = await listBrokerages({
      page: 1,
      pageSize: 100,
      situation: brokerageSituations.active,
    })
    brokerages.value = response.items
  }
  catch {
    brokeragesError.value = 'Não foi possível carregar as corretoras.'
    brokerages.value = []
  }
  finally {
    brokeragesLoading.value = false
  }
}

function submit() {
  if (!formValid.value || !brokerageIds.value.length) {
    return
  }

  emit('confirm', {
    name: name.value.trim(),
    email: email.value.trim(),
    brokerageIds: [...brokerageIds.value],
  })
}
</script>

<template>
  <SiDialog
    v-model="open"
    max-width="560"
  >
    <SiCard class="si-invite-ca">
      <h2 class="text-h6 mb-1">
        Convidar corretor administrador
      </h2>

      <p class="si-invite-ca__hint mb-5">
        O convidado recebe um e-mail com link de primeiro acesso e define a própria senha. Ele nasce
        na situação Pendente, com o perfil Corretor Administrador em cada corretora informada.
      </p>

      <SiAlert
        v-if="brokeragesError"
        type="error"
        class="mb-4"
        :text="brokeragesError"
      />

      <SiForm v-model="formValid">
        <SiTextField
          v-model="name"
          label="Nome"
          :rules="[required()]"
          class="mb-3"
        />

        <SiTextField
          v-model="email"
          label="E-mail"
          type="email"
          :rules="[required(), emailRule()]"
          class="mb-3"
        />

        <SiSelect
          v-model="brokerageIds"
          label="Corretoras"
          :items="brokerageOptions"
          :loading="brokeragesLoading"
          :rules="[required()]"
          multiple
          chips
          closable-chips
        />
      </SiForm>

      <div class="si-invite-ca__actions">
        <SiButton
          variant="text"
          size="small"
          @click="open = false"
        >
          Cancelar
        </SiButton>

        <SiButton
          :prepend-icon="'userPlus'"
          :loading="props.submitting"
          :disabled="!formValid || !brokerageIds.length"
          size="small"
          @click="submit"
        >
          Enviar convite
        </SiButton>
      </div>
    </SiCard>
  </SiDialog>
</template>

<style scoped>
.si-invite-ca {
  padding: var(--si-space-5);
}

.si-invite-ca__hint {
  color: var(--si-cinza);
  font-size: var(--si-fs-body-2);
}

.si-invite-ca__actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--si-space-2);
  margin-top: var(--si-space-5);
}
</style>
