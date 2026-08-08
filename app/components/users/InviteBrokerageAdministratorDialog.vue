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
import { extractApiErrorMessage } from '~/lib/apiError'
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
const adderValue = ref<string | null>(null)
const brokerages = ref<BrokerageListItem[]>([])
const brokeragesLoading = ref(false)
const brokeragesError = ref<string | null>(null)
const formValid = ref(false)

// §15: o Select funciona como "adicionar" — as já escolhidas somem das opções e viram chips.
const availableOptions = computed(() =>
  brokerages.value
    .filter(brokerage => !brokerageIds.value.includes(brokerage.id))
    .map(brokerage => ({
      title: `${brokerage.name} — ${formatCnpj(brokerage.documentNumber)}`,
      value: brokerage.id,
    })),
)

const selectedBrokerages = computed(() =>
  brokerageIds.value
    .map(id => brokerages.value.find(brokerage => brokerage.id === id))
    .filter((brokerage): brokerage is BrokerageListItem => Boolean(brokerage)),
)

const adderPlaceholder = computed(() =>
  availableOptions.value.length ? 'Adicionar corretora' : 'Todas já foram adicionadas',
)

const canSubmit = computed(() => formValid.value && brokerageIds.value.length > 0)

// Carrega as corretoras ativas na primeira abertura e a cada reabertura (a situação pode ter mudado).
watch(open, async (isOpen) => {
  if (!isOpen) {
    return
  }

  name.value = ''
  email.value = ''
  brokerageIds.value = []
  adderValue.value = null
  await loadBrokerages()
})

function onAdd(value: unknown) {
  const id = value as string | null
  if (id && !brokerageIds.value.includes(id)) {
    brokerageIds.value = [...brokerageIds.value, id]
  }
  adderValue.value = null
}

function removeBrokerage(id: string) {
  brokerageIds.value = brokerageIds.value.filter(current => current !== id)
}

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
  catch (err) {
    brokeragesError.value = extractApiErrorMessage(err, 'Não foi possível carregar as corretoras.')
    brokerages.value = []
  }
  finally {
    brokeragesLoading.value = false
  }
}

function submit() {
  if (!canSubmit.value) {
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
      <h2 class="si-invite-ca__title">
        Convidar corretor administrador
      </h2>
      <p class="si-invite-ca__hint">
        Acesso de administração da plataforma. Use quando uma corretora ainda não tem ninguém para
        gerenciar os próprios usuários.
      </p>

      <SiAlert
        v-if="brokeragesError"
        type="error"
        class="mb-4"
        :text="brokeragesError"
      />

      <SiForm v-model="formValid">
        <div class="si-invite-ca__grid">
          <SiTextField
            v-model="name"
            label="Nome"
            :rules="[required()]"
          />
          <SiTextField
            v-model="email"
            label="E-mail"
            type="email"
            :rules="[required(), emailRule()]"
          />
        </div>
      </SiForm>

      <div class="si-invite-ca__brokerages">
        <SiSelect
          :model-value="adderValue"
          label="Corretoras"
          :items="availableOptions"
          :loading="brokeragesLoading"
          :disabled="!availableOptions.length"
          :placeholder="adderPlaceholder"
          @update:model-value="onAdd"
        />

        <div
          v-if="selectedBrokerages.length"
          class="si-invite-ca__chips"
        >
          <SiChip
            v-for="brokerage in selectedBrokerages"
            :key="brokerage.id"
            size="small"
            closable
            @click:close="removeBrokerage(brokerage.id)"
          >
            {{ brokerage.name }}
          </SiChip>
        </div>
      </div>

      <p class="si-invite-ca__note">
        Ele nasce na situação Pendente com o perfil Corretor Administrador em cada corretora
        informada. É um acesso de administração da plataforma — não conta como usuário da sua corretora.
      </p>

      <div class="si-invite-ca__actions">
        <SiButton
          variant="text"
          color="secondary"
          @click="open = false"
        >
          Cancelar
        </SiButton>
        <SiButton
          :prepend-icon="'userPlus'"
          :loading="props.submitting"
          :disabled="!canSubmit"
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

.si-invite-ca__title {
  margin: 0 0 var(--si-space-1);
  font-size: var(--si-fs-h4);
  font-weight: var(--si-font-weight-semibold);
}

.si-invite-ca__hint {
  margin: 0 0 var(--si-space-5);
  color: var(--si-cinza);
  font-size: var(--si-fs-body-2);
}

.si-invite-ca__grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--si-space-4);
}

.si-invite-ca__brokerages {
  margin-top: var(--si-space-3);
}

.si-invite-ca__chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--si-space-2);
  margin-top: var(--si-space-2);
}

.si-invite-ca__note {
  margin: var(--si-space-4) 0 0;
  color: var(--si-cinza);
  font-size: var(--si-fs-caption);
}

.si-invite-ca__actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--si-space-2);
  margin-top: var(--si-space-5);
}

@media (max-width: 599.98px) {
  .si-invite-ca__grid {
    grid-template-columns: 1fr;
  }
}
</style>
