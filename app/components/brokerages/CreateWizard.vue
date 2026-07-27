<script setup lang="ts">
/**
 * Novo cadastro de Corretora em modal por etapas (RN-052/RN-019). A consulta guarda os dados do
 * CNPJ na base (cache reutilizável, para evitar custo de nova consulta ao Birô), mas a Corretora
 * só é criada — e passa a aparecer na listagem — na confirmação. Cancelar na revisão não cria a
 * corretora.
 */
import type { BrokeragePreview } from '~/composables/useBrokerages'
import { formatCnpj } from '~/lib/documents'
import { formatAddress } from '~/lib/format'
import { cnpj as cnpjRule, required } from '~/lib/rules'

const open = defineModel<boolean>({ default: false })

const emit = defineEmits<{
  created: [payload: { id: string, incomplete: boolean }]
  discarded: []
}>()

const { previewBrokerage, createBrokerage } = useBrokerages()
const { isMobile } = useIsMobile()

type Stage = 'search' | 'loading' | 'dup' | 'review'

const stage = ref<Stage>('search')
const cnpjInput = ref('')
const preview = ref<BrokeragePreview | null>(null)
const error = ref<string | null>(null)
const submitting = ref(false)
const discardOpen = ref(false)

const form = ref({
  socialName: '',
  contactEmail: '',
  contactPhone: '',
  responsibleName: '',
  activateOnSave: true,
})

// Duas etapas: buscar o CNPJ e revisar/salvar. A confirmação é a própria ação "Salvar
// corretora" na revisão (RN-019) — não há um 3º passo dedicado.
const steps = [
  { label: 'Buscar CNPJ' },
  { label: 'Revisar dados' },
]

const currentStep = computed(() => (stage.value === 'review' ? 1 : 0))

const footerNote = computed(() =>
  stage.value === 'review'
    ? 'Confirme para criar a corretora'
    : 'Etapa 1 de 2')

// Reinicia o fluxo a cada abertura.
watch(open, (isOpen) => {
  if (isOpen) reset()
})

function reset() {
  stage.value = 'search'
  cnpjInput.value = ''
  preview.value = null
  error.value = null
  submitting.value = false
  discardOpen.value = false
  form.value = { socialName: '', contactEmail: '', contactPhone: '', responsibleName: '', activateOnSave: true }
}

async function consult() {
  error.value = null
  stage.value = 'loading'
  try {
    const result = await previewBrokerage(cnpjInput.value)
    preview.value = result
    if (result.alreadyRegistered) {
      stage.value = 'dup'
      return
    }
    form.value.socialName = result.socialName ?? ''
    stage.value = 'review'
  }
  catch (err) {
    error.value = getErrorMessage(err, 'Não foi possível consultar o CNPJ.')
    stage.value = 'search'
  }
}

async function save() {
  if (!preview.value) return
  submitting.value = true
  error.value = null
  try {
    const created = await createBrokerage({
      cnpj: preview.value.documentNumber,
      socialName: form.value.socialName || null,
      contactEmail: form.value.contactEmail || null,
      contactPhone: form.value.contactPhone || null,
      responsibleName: form.value.responsibleName || null,
      activateOnSave: form.value.activateOnSave,
    })
    emit('created', { id: created.id, incomplete: created.situation === 'Incomplete' })
    open.value = false
  }
  catch (err) {
    error.value = getErrorMessage(err, 'Não foi possível cadastrar a corretora.')
  }
  finally {
    submitting.value = false
  }
}

function onDialogToggle(value?: boolean) {
  if (!value) requestClose()
}

function requestClose() {
  if (stage.value === 'review') {
    discardOpen.value = true
    return
  }
  open.value = false
}

function confirmDiscard() {
  discardOpen.value = false
  open.value = false
  emit('discarded')
}

function consultAnother() {
  reset()
}

function sectorLabel(value: boolean | null | undefined) {
  if (value === null || value === undefined) return '—'
  return value ? 'Privado' : 'Público'
}

function getErrorMessage(err: unknown, fallback: string): string {
  if (typeof err === 'object' && err !== null && 'data' in err) {
    const data = (err as { data?: { detail?: unknown, message?: unknown } }).data
    if (typeof data?.detail === 'string') return data.detail
    if (typeof data?.message === 'string') return data.message
  }
  return fallback
}
</script>

<template>
  <SiDialog
    :model-value="open"
    :max-width="780"
    :fullscreen="isMobile"
    @update:model-value="onDialogToggle"
  >
    <SiCard :class="['si-create', { 'si-create--fullscreen': isMobile }]">
      <header class="si-create__header">
        <div class="si-create__header-top">
          <h2 class="text-h6">
            Nova corretora
          </h2>
          <SiIconButton
            icon="close"
            aria-label="Fechar"
            @click="requestClose"
          />
        </div>
        <SiStepper
          :steps="steps"
          :current="currentStep"
        />
      </header>

      <div class="si-create__body">
        <!-- Etapa 1: buscar CNPJ -->
        <template v-if="stage === 'search'">
          <SiForm @submit.prevent="consult">
            <div class="si-create__cnpj-row">
              <SiDocField
                v-model="cnpjInput"
                tipo="cnpj"
                label="CNPJ da corretora"
                placeholder="00.000.000/0000-00"
                hint="Consultamos a Receita Federal. A corretora só é criada quando você confirmar."
                persistent-hint
                :rules="[required(), cnpjRule()]"
                validate-on="submit"
                autofocus
                class="si-create__cnpj"
              />
              <SiButton
                type="submit"
                :prepend-icon="'search'"
                class="si-create__consult"
              >
                Consultar
              </SiButton>
            </div>
          </SiForm>

          <SiAlert
            v-if="error"
            type="error"
            class="mt-3"
            :text="error"
          />

          <div class="si-create__notice">
            A corretora só é criada quando você confirmar. Você pode revisar, corrigir os dados
            complementares ou cancelar — cancelar não cria a corretora.
          </div>
        </template>

        <!-- Carregando -->
        <div
          v-else-if="stage === 'loading'"
          class="si-create__loading"
        >
          <SiProgressCircular
            indeterminate
            :size="34"
            :width="3"
          />
          <p class="si-create__loading-text">
            Consultando a Receita Federal…
          </p>
          <p class="si-create__loading-cnpj">
            {{ formatCnpj(cnpjInput) }}
          </p>
        </div>

        <!-- CNPJ já cadastrado -->
        <template v-else-if="stage === 'dup'">
          <SiAlert
            type="warning"
            title="Este CNPJ já está cadastrado"
            text="Esta corretora já existe na base. Você pode abrir o cadastro existente ou consultar outro CNPJ."
          />
          <div class="si-create__dup-actions">
            <SiButton
              :to="`/corretoras/${preview?.existingBrokerageId}`"
              :prepend-icon="'eye'"
            >
              Abrir cadastro existente
            </SiButton>
            <SiButton
              variant="outlined"
              color="secondary"
              @click="consultAnother"
            >
              Consultar outro CNPJ
            </SiButton>
          </div>
        </template>

        <!-- Etapa 2: revisar dados -->
        <template v-else>
          <div class="si-create__success">
            Dados encontrados na Receita Federal.
          </div>

          <section class="si-create__block">
            <div class="si-create__block-header">
              <span class="si-create__eyebrow">Dados da Receita · somente leitura</span>
            </div>
            <dl class="si-create__receita">
              <div>
                <dt>CNPJ</dt>
                <dd>{{ formatCnpj(preview?.documentNumber ?? '') }}</dd>
              </div>
              <div class="si-create__span2">
                <dt>Razão social</dt>
                <dd>{{ preview?.name }}</dd>
              </div>
              <div>
                <dt>Natureza jurídica</dt>
                <dd>{{ preview?.legalNatureName ?? '—' }}</dd>
              </div>
              <div>
                <dt>Código</dt>
                <dd>{{ preview?.legalNatureCode ?? '—' }}</dd>
              </div>
              <div>
                <dt>Setor</dt>
                <dd>{{ sectorLabel(preview?.isPrivateSector) }}</dd>
              </div>
              <div class="si-create__span-all">
                <dt>Endereço principal</dt>
                <dd>{{ formatAddress(preview?.mainAddress) }}</dd>
              </div>
            </dl>
          </section>

          <section class="si-create__block">
            <span class="si-create__eyebrow">Complementar</span>
            <div class="si-create__complementar">
              <SiTextField
                v-model="form.socialName"
                label="Nome fantasia"
                density="compact"
              />
              <SiTextField
                v-model="form.contactEmail"
                label="E-mail de contato"
                type="email"
                density="compact"
              />
              <SiTextField
                v-model="form.contactPhone"
                label="Telefone"
                density="compact"
              />
              <SiTextField
                v-model="form.responsibleName"
                label="Responsável"
                density="compact"
              />
            </div>
            <p class="si-create__hint-warn">
              Sem nome fantasia e contato o cadastro fica marcado como <strong>incompleto</strong> na listagem.
            </p>
          </section>

          <SiSwitch
            v-model="form.activateOnSave"
            label="Ativar corretora ao salvar"
            hint="Corretoras inativas não aparecem para cotação."
            persistent-hint
          />

          <SiAlert
            v-if="error"
            type="error"
            class="mt-2"
            :text="error"
          />
        </template>
      </div>

      <footer class="si-create__footer">
        <span class="si-create__footer-note">{{ footerNote }}</span>
        <div class="si-create__footer-actions">
          <SiButton
            variant="text"
            @click="requestClose"
          >
            Cancelar
          </SiButton>
          <SiButton
            v-if="stage === 'review'"
            :prepend-icon="'check'"
            :loading="submitting"
            @click="save"
          >
            Salvar corretora
          </SiButton>
        </div>
      </footer>
    </SiCard>

    <!-- Confirmação de descarte -->
    <SiDialog
      v-model="discardOpen"
      :max-width="420"
    >
      <SiCard class="pa-5">
        <h3 class="text-h6 mb-2">
          Descartar cadastro?
        </h3>
        <p class="mb-5 si-create__discard-text">
          Nenhuma corretora será criada. Você pode consultar este CNPJ de novo quando quiser.
        </p>
        <div class="si-create__discard-actions">
          <SiButton
            variant="outlined"
            color="secondary"
            @click="discardOpen = false"
          >
            Continuar cadastro
          </SiButton>
          <SiButton
            color="error"
            @click="confirmDiscard"
          >
            Descartar
          </SiButton>
        </div>
      </SiCard>
    </SiDialog>
  </SiDialog>
</template>

<style scoped>
.si-create {
  display: flex;
  flex-direction: column;
  max-height: min(92vh, 720px);
}

/* Mobile: cadastro em tela cheia (SiDialog fullscreen). O corpo rola e o rodapé de
 * ação ("Salvar corretora") fica fixo no rodapé da tela. */
.si-create--fullscreen {
  block-size: 100dvh;
  max-height: 100dvh;
  border-radius: 0;
}

.si-create__header {
  padding: var(--si-space-5) var(--si-space-6) var(--si-space-4);
  border-bottom: 1px solid var(--si-cinza-claro);
}

.si-create__header-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--si-space-4);
}

.si-create__header-top h2 {
  margin: 0;
}

.si-create__body {
  padding: var(--si-space-5) var(--si-space-6);
  overflow-y: auto;
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: var(--si-space-4);
}

.si-create__cnpj-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: var(--si-space-3);
  align-items: start;
}

.si-create__consult {
  min-height: 42px;
  margin-top: 26px;
}

.si-create__notice {
  border: 1px dashed var(--si-cinza-claro);
  border-radius: var(--si-radius-lg);
  background: rgb(var(--v-theme-background));
  padding: var(--si-space-4);
  color: var(--si-cinza);
  font-size: var(--si-fs-body-2);
}

.si-create__loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--si-space-2);
  padding: var(--si-space-8) 0;
}

.si-create__loading-text {
  margin: var(--si-space-2) 0 0;
  font-weight: var(--si-font-weight-semibold);
}

.si-create__loading-cnpj {
  margin: 0;
  color: var(--si-cinza);
  font-variant-numeric: tabular-nums;
}

.si-create__dup-actions {
  display: flex;
  gap: var(--si-space-2);
}

.si-create__success {
  background: rgba(var(--v-theme-success), 0.08);
  border: 1px solid var(--si-verde-100);
  border-radius: var(--si-radius-md);
  padding: var(--si-space-3) var(--si-space-4);
  color: var(--si-verde-700-text);
  font-size: var(--si-fs-body-2);
  font-weight: var(--si-font-weight-semibold);
}

.si-create__block {
  display: flex;
  flex-direction: column;
  gap: var(--si-space-3);
}

.si-create__eyebrow {
  font-size: var(--si-fs-caption);
  font-weight: var(--si-font-weight-semibold);
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--si-cinza);
}

.si-create__block-header {
  background: rgb(var(--v-theme-background));
  border: 1px solid var(--si-cinza-claro);
  border-radius: var(--si-radius-lg) var(--si-radius-lg) 0 0;
  padding: var(--si-space-3) var(--si-space-4);
  margin-bottom: calc(var(--si-space-3) * -1);
}

.si-create__receita {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
  gap: var(--si-space-4);
  border: 1px solid var(--si-cinza-claro);
  border-radius: 0 0 var(--si-radius-lg) var(--si-radius-lg);
  padding: var(--si-space-4);
  margin: 0;
}

.si-create__receita div {
  display: grid;
  gap: var(--si-space-1);
}

.si-create__receita dt {
  color: var(--si-cinza);
  font-size: var(--si-fs-caption);
}

.si-create__receita dd {
  margin: 0;
  font-weight: var(--si-font-weight-semibold);
}

.si-create__span2 {
  grid-column: span 2;
}

.si-create__span-all {
  grid-column: 1 / -1;
}

.si-create__complementar {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: var(--si-space-3);
}

.si-create__hint-warn {
  margin: 0;
  font-size: var(--si-fs-caption);
  color: var(--si-cinza);
}

.si-create__hint-warn strong {
  color: var(--si-warning-fg);
}

.si-create__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--si-space-3);
  padding: var(--si-space-4) var(--si-space-6);
  border-top: 1px solid var(--si-cinza-claro);
  background: rgb(var(--v-theme-background));
}

.si-create__footer-note {
  color: var(--si-cinza);
  font-size: var(--si-fs-caption);
}

.si-create__footer-actions {
  display: flex;
  gap: var(--si-space-2);
}

.si-create__discard-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--si-space-2);
}

.si-create__discard-text {
  color: var(--si-cinza);
}

@media (max-width: 640px) {
  .si-create__cnpj-row,
  .si-create__complementar,
  .si-create__receita {
    grid-template-columns: 1fr;
  }

  .si-create__consult {
    margin-top: 0;
  }
}
</style>
