<script setup lang="ts">
/**
 * Vitrine do design system (ADR-013 §7). Rota só de desenvolvimento (removida do build
 * de produção — ver nuxt.config.ts). Consumidor vivo que valida os wrappers `Si` e serve
 * de documentação/onboarding. Componente novo entra aqui.
 */
import { mdiShieldCheckOutline, mdiMenu, mdiDotsVertical, mdiAccount } from '~/lib/icons'
import { required, email, cpfCnpj } from '~/lib/rules'

useHead({ title: 'SmartInsure · Vitrine UI' })

const text = ref('')
const notes = ref('')
const selected = ref<string | null>(null)
const checked = ref(true)
const switchOn = ref(true)
const radioOption = ref('a')
const tab = ref('cotacoes')
const panel = ref<number>()
const dialog = ref(false)
const menu = ref(false)
const progress = ref(65)

const tablePage = ref(1)
const tablePerPage = ref(10)

const options = ['Cliente', 'Corretora', 'Seguradora']

// Formulário (onda 2) — composição dos campos Si + validação nativa.
const formRef = ref()
const formValid = ref<boolean | null>(null)
const fEmail = ref('')
const fDoc = ref('')
const fAmount = ref<number | null>(null)
const fDate = ref<string | null>(null)
const submitted = ref('')

async function submitForm() {
  const { valid } = await formRef.value.validate()
  submitted.value = valid
    ? JSON.stringify({ fEmail: fEmail.value, fDoc: fDoc.value, fAmount: fAmount.value, fDate: fDate.value })
    : 'inválido — corrija os campos'
}

const headers = [
  { title: 'Corretora', key: 'name' },
  { title: 'Prêmio', key: 'premium' },
  { title: 'Status', key: 'status' },
]
const items = [
  { name: 'Alfa Seguros', premium: 'R$ 1.240,00', status: 'Cotada' },
  { name: 'Beta Corretora', premium: 'R$ 980,50', status: 'Proposta' },
  { name: 'Gama Hub', premium: 'R$ 2.115,90', status: 'Emitida' },
]
</script>

<template>
  <VMain class="bg-background">
    <VContainer class="py-8">
      <div class="mb-8">
        <p class="text-caption text-medium-emphasis" style="letter-spacing: var(--si-ls-eyebrow)">DESIGN SYSTEM</p>
        <h1 class="text-h4 font-weight-bold">Vitrine de componentes <code>Si</code></h1>
        <p class="text-body-2 text-medium-emphasis">Só em desenvolvimento. Cada wrapper encapsula o Vuetify (ADR-013).</p>
      </div>

      <!-- Ações -->
      <SiCard class="mb-6">
        <VCardTitle>Ações — SiButton</VCardTitle>
        <VCardText class="d-flex flex-wrap align-center" style="gap: var(--si-space-3)">
          <SiButton>Primário</SiButton>
          <SiButton variant="tonal">Tonal</SiButton>
          <SiButton variant="outlined">Outlined</SiButton>
          <SiButton variant="text">Text</SiButton>
          <SiButton color="secondary">Secundário</SiButton>
          <SiButton color="error">Perigo</SiButton>
          <SiButton :loading="true">Carregando</SiButton>
          <SiButton :disabled="true">Desabilitado</SiButton>
          <SiButton size="small">Pequeno</SiButton>
          <SiButton size="large">Grande</SiButton>
        </VCardText>
      </SiCard>

      <!-- Ícone, Chip, Badge, Avatar -->
      <SiCard class="mb-6">
        <VCardTitle>SiIcon · SiChip · SiBadge · SiAvatar</VCardTitle>
        <VCardText class="d-flex flex-wrap align-center" style="gap: var(--si-space-4)">
          <SiIcon :icon="mdiShieldCheckOutline" color="primary" size="large" />
          <SiIcon :icon="mdiMenu" />
          <SiChip>Padrão</SiChip>
          <SiChip color="success">Sucesso</SiChip>
          <SiChip color="warning">Aviso</SiChip>
          <SiChip color="error" variant="outlined">Erro</SiChip>
          <SiBadge :content="3" color="error">
            <SiIcon :icon="mdiMenu" />
          </SiBadge>
          <SiAvatar color="primary"><SiIcon :icon="mdiAccount" /></SiAvatar>
          <SiAvatar color="secondary" size="small">DE</SiAvatar>
        </VCardText>
      </SiCard>

      <!-- Campos -->
      <SiCard class="mb-6">
        <VCardTitle>Campos (secos)</VCardTitle>
        <VCardText>
          <VRow>
            <VCol cols="12" md="6">
              <SiTextField v-model="text" label="Nome" placeholder="Digite…" clearable />
            </VCol>
            <VCol cols="12" md="6">
              <SiSelect v-model="selected" :items="options" label="Tipo" clearable />
            </VCol>
            <VCol cols="12">
              <SiTextarea v-model="notes" label="Observações" auto-grow />
            </VCol>
            <VCol cols="12" md="4">
              <SiCheckbox v-model="checked" label="Aceito os termos" />
            </VCol>
            <VCol cols="12" md="4">
              <SiSwitch v-model="switchOn" label="Notificações" />
            </VCol>
            <VCol cols="12" md="4">
              <SiRadioGroup v-model="radioOption" label="Plano" inline>
                <SiRadio label="A" value="a" />
                <SiRadio label="B" value="b" />
              </SiRadioGroup>
            </VCol>
          </VRow>
          <p class="text-caption text-medium-emphasis mt-2">
            Modelos: {{ { text, selected, checked, switchOn, radioOption } }}
          </p>
        </VCardText>
      </SiCard>

      <!-- Formulário (Onda 2) — família de form composta -->
      <SiCard class="mb-6">
        <VCardTitle>Formulário — família de form (Onda 2)</VCardTitle>
        <VCardText>
          <SiForm ref="formRef" v-model="formValid">
            <VRow>
              <VCol cols="12" md="6">
                <SiTextField v-model="fEmail" label="E-mail" :rules="[required(), email()]" />
              </VCol>
              <VCol cols="12" md="6">
                <SiDocField v-model="fDoc" label="CPF/CNPJ" :rules="[required(), cpfCnpj()]" />
              </VCol>
              <VCol cols="12" md="6">
                <SiCurrencyField v-model="fAmount" label="Prêmio (BRL)" :rules="[required('Informe o valor')]" />
              </VCol>
              <VCol cols="12" md="6">
                <SiDateField v-model="fDate" label="Vigência" :rules="[required('Informe a data')]" />
                <p class="text-caption text-medium-emphasis mt-n2">valor (backend): {{ fDate ?? '—' }}</p>
              </VCol>
            </VRow>
            <div class="d-flex align-center mt-2" style="gap: var(--si-space-3)">
              <SiButton @click="submitForm">Validar e enviar</SiButton>
              <span class="text-caption text-medium-emphasis">Válido: {{ formValid }} · Enviado: {{ submitted }}</span>
            </div>
          </SiForm>
        </VCardText>
      </SiCard>

      <!-- Abas + Expansão -->
      <SiCard class="mb-6">
        <SiTabs v-model="tab">
          <SiTab value="cotacoes" text="Cotações" />
          <SiTab value="propostas" text="Propostas" />
        </SiTabs>
        <VCardText>
          <SiExpansionPanels v-model="panel">
            <SiExpansionPanel title="Detalhes da oferta">
              <template #text>Conteúdo do painel — aba ativa: {{ tab }}.</template>
            </SiExpansionPanel>
            <SiExpansionPanel title="Condições">
              <template #text>Prazos e coberturas.</template>
            </SiExpansionPanel>
          </SiExpansionPanels>
        </VCardText>
      </SiCard>

      <!-- Tabela -->
      <SiCard class="mb-6">
        <VCardTitle>SiDataTable</VCardTitle>
        <SiDataTable :headers="headers" :items="items" hide-default-footer />
        <SiPagination
          v-model:page="tablePage"
          v-model:items-per-page="tablePerPage"
          :total="2313"
        />
      </SiCard>

      <!-- Overlays -->
      <SiCard class="mb-6">
        <VCardTitle>Overlays — SiDialog · SiMenu · SiTooltip</VCardTitle>
        <VCardText class="d-flex flex-wrap align-center" style="gap: var(--si-space-3)">
          <SiButton @click="dialog = true">Abrir diálogo</SiButton>
          <SiDialog v-model="dialog">
            <SiCard>
              <VCardTitle>Confirmar</VCardTitle>
              <VCardText>Deseja aceitar esta cotação?</VCardText>
              <VCardActions>
                <VSpacer />
                <SiButton variant="text" @click="dialog = false">Cancelar</SiButton>
                <SiButton @click="dialog = false">Confirmar</SiButton>
              </VCardActions>
            </SiCard>
          </SiDialog>

          <SiMenu v-model="menu">
            <template #activator="{ props }">
              <SiButton variant="outlined" v-bind="props">
                <SiIcon :icon="mdiDotsVertical" /> Menu
              </SiButton>
            </template>
            <SiList>
              <SiListItem title="Editar" value="editar" />
              <SiListItem title="Duplicar" value="duplicar" />
              <SiListItem title="Excluir" value="excluir" />
            </SiList>
          </SiMenu>

          <SiTooltip text="Dica útil">
            <template #activator="{ props }">
              <SiButton variant="tonal" v-bind="props">Passe o mouse</SiButton>
            </template>
          </SiTooltip>
        </VCardText>
      </SiCard>

      <!-- Progresso + Divider -->
      <SiCard class="mb-6">
        <VCardTitle>Progresso &amp; Divider</VCardTitle>
        <VCardText>
          <div class="d-flex align-center mb-4" style="gap: var(--si-space-4)">
            <SiProgressCircular indeterminate />
            <SiProgressCircular :model-value="progress" :size="48">{{ progress }}</SiProgressCircular>
          </div>
          <SiDivider class="my-4" />
          <SiProgressLinear :model-value="progress" class="mb-2" />
          <SiProgressLinear indeterminate color="secondary" />
        </VCardText>
      </SiCard>

      <!-- Feedback -->
      <SiCard class="mb-6">
        <VCardTitle>SiAlert</VCardTitle>
        <VCardText class="d-flex flex-column" style="gap: var(--si-space-3)">
          <SiAlert type="success" text="Cotação recebida com sucesso." />
          <SiAlert type="info" text="Aguardando retorno da seguradora." />
          <SiAlert type="warning" text="Vigência próxima do vencimento." />
          <SiAlert type="error" text="Falha ao processar a proposta." />
        </VCardText>
      </SiCard>
    </VContainer>
  </VMain>
</template>
