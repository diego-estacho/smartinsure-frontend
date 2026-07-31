<script setup lang="ts">
/**
 * Filiais do Tomador (RN-025/RN-101): a lista vem por prop, do detalhe do Tomador
 * (`GET /policy-holders/{id}` já traz `branches[]` — Task 6) — este painel nunca chama
 * `listBranches` (esse composable serve a etapa 1 do wizard de cotação, Task 9/10); ler daqui
 * evita a ficha e o wizard discordarem sobre o que é uma Filial registrada.
 *
 * Registrar uma nova Filial por CNPJ segue o mesmo contrato de `Step1PolicyHolder.vue`: o
 * servidor decide o desfecho e o painel só repassa o corpo da resposta, sem reinterpretar regra
 * de negócio no cliente (ADR-004). `branchId` presente é o caminho feliz — fecha o dialog e
 * avisa o pai (`changed`) para recarregar o detalhe, que já traz a Filial nova (sem seguir
 * marcando/selecionando nada aqui — isso é só do wizard). `branchId` nulo com `notice` é o Birô
 * não achando aquele CNPJ — retorno não-erro (a matriz continua usável); o dialog permanece
 * aberto para tentar outro CNPJ. Uma exceção (rede/500) é erro de fato. O servidor rejeita CNPJ
 * de raiz diferente da do tomador e CNPJ `/0001` como Filial — não replicamos essas checagens
 * aqui, só mostramos o que ele responder.
 */
import type { CreatePolicyHolderBranchResponse, PolicyHolderBranch } from '~/composables/usePolicyHolderBranches'
import { formatCnpj } from '~/lib/documents'

const props = withDefaults(defineProps<{ policyHolderId: string, branches: PolicyHolderBranch[], hideToolbar?: boolean }>(), {
  hideToolbar: false,
})

const emit = defineEmits<{ changed: [] }>()

const { createBranch } = usePolicyHolderBranches()

const saving = ref(false)
const error = ref<string | null>(null)

const headers = [
  { title: 'CNPJ', key: 'documentNumber' },
  { title: 'Razão social', key: 'name' },
  { title: 'Nome fantasia', key: 'socialName' },
]

/** Formulário do dialog (registrar por CNPJ). */
const formOpen = ref(false)
const branchCnpj = ref('')
const notice = ref<string | null>(null)

defineExpose({ openCreateDialog })

function openCreateDialog() {
  branchCnpj.value = ''
  error.value = null
  notice.value = null
  formOpen.value = true
}

function closeDialog() {
  formOpen.value = false
  branchCnpj.value = ''
}

async function submitForm() {
  saving.value = true
  error.value = null
  notice.value = null

  try {
    const result: CreatePolicyHolderBranchResponse = await createBranch(props.policyHolderId, branchCnpj.value)
    if (result.branchId) {
      formOpen.value = false
      branchCnpj.value = ''
      emit('changed')
    }
    else {
      // Contrato-impossível: nem `branchId` nem `notice` vieram preenchidos. Mensagem genérica —
      // não inventamos um motivo que o backend não informou (ADR-004).
      notice.value = result.notice ?? 'Não foi possível registrar a filial: resposta inesperada do servidor.'
    }
  }
  catch (err) {
    // 422 é o Backend rejeitando por RN-101 (raiz de CNPJ diferente da do tomador, ou `/0001` como
    // Filial) com o motivo em `detail` — mostramos o texto do servidor, sem reimplementar a checagem
    // aqui (ADR-004). Sem `detail` (ou erro de outra natureza — rede, 500, corpo malformado), cai na
    // mensagem genérica.
    const errorObj = err as { status?: number, data?: { detail?: string } }
    error.value = typeof err === 'object' && err !== null && 'status' in err && errorObj.status === 422
      ? errorObj.data?.detail || 'Não foi possível registrar a filial.'
      : 'Não foi possível registrar a filial.'
  }
  finally {
    saving.value = false
  }
}
</script>

<template>
  <section class="si-policy-holder-branches-panel">
    <div
      v-if="!props.hideToolbar"
      class="si-policy-holder-branches-panel__toolbar"
    >
      <SiButton
        :prepend-icon="'plus'"
        @click="openCreateDialog"
      >
        Nova filial
      </SiButton>
    </div>

    <div class="si-policy-holder-branches-panel__table">
      <SiDataTable
        :headers="headers"
        :items="props.branches"
      >
        <template #[`item.documentNumber`]="{ item }">
          {{ formatCnpj(item.documentNumber) }}
        </template>

        <template #[`item.socialName`]="{ item }">
          {{ item.socialName ?? '-' }}
        </template>

        <template #no-data>
          Nenhuma filial registrada.
        </template>
      </SiDataTable>
    </div>

    <SiDialog v-model="formOpen">
      <SiCard class="pa-5">
        <h2 class="text-h6 mb-3">
          Nova filial
        </h2>

        <SiForm @submit.prevent="submitForm">
          <SiDocField
            v-model="branchCnpj"
            tipo="cnpj"
            label="CNPJ da filial"
            hint="A filial herda os dados cadastrais do tomador."
            density="comfortable"
          />

          <SiAlert
            v-if="notice"
            type="info"
            class="mt-3 mb-0"
            :text="notice"
          />
          <SiAlert
            v-if="error"
            type="error"
            class="mt-3 mb-0"
            :text="error"
          />

          <div class="si-policy-holder-branches-panel__dialog-actions">
            <SiButton
              variant="text"
              @click="closeDialog"
            >
              Cancelar
            </SiButton>

            <SiButton
              type="submit"
              :loading="saving"
            >
              Salvar
            </SiButton>
          </div>
        </SiForm>
      </SiCard>
    </SiDialog>
  </section>
</template>

<style scoped>
.si-policy-holder-branches-panel__toolbar {
  display: flex;
  justify-content: flex-end;
  margin-bottom: var(--si-space-3);
}

.si-policy-holder-branches-panel__table {
  overflow-x: auto;
}

.si-policy-holder-branches-panel__dialog-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--si-space-2);
  margin-top: var(--si-space-5);
}
</style>
