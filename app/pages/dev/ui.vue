<script setup lang="ts">
/**
 * Vitrine do design system (ADR-013 §7). Rota só de desenvolvimento (removida do build
 * de produção — ver nuxt.config.ts). Consumidor vivo que valida os wrappers `Si` e serve
 * de documentação/onboarding. Componente novo entra aqui.
 */
import { mdiShieldCheckOutline, mdiMenu, mdiDotsVertical, mdiAccount } from '~/lib/icons'
import { required, email, cpfCnpj } from '~/lib/rules'

useHead({ title: 'SmartInsure · Vitrine UI' })

const texto = ref('')
const area = ref('')
const selecionado = ref<string | null>(null)
const marcado = ref(true)
const ligado = ref(true)
const opcao = ref('a')
const aba = ref('cotacoes')
const painel = ref<number>()
const dialogo = ref(false)
const menu = ref(false)
const progresso = ref(65)

const opcoes = ['Cliente', 'Corretora', 'Seguradora']

// Formulário (onda 2) — composição dos campos Si + validação nativa.
const formRef = ref()
const formValido = ref<boolean | null>(null)
const fEmail = ref('')
const fDoc = ref('')
const fValor = ref<number | null>(null)
const fData = ref<string | null>(null)
const enviado = ref('')

async function enviarForm() {
  const { valid } = await formRef.value.validate()
  enviado.value = valid
    ? JSON.stringify({ fEmail: fEmail.value, fDoc: fDoc.value, fValor: fValor.value, fData: fData.value })
    : 'inválido — corrija os campos'
}

const headers = [
  { title: 'Corretora', key: 'nome' },
  { title: 'Prêmio', key: 'premio' },
  { title: 'Status', key: 'status' },
]
const items = [
  { nome: 'Alfa Seguros', premio: 'R$ 1.240,00', status: 'Cotada' },
  { nome: 'Beta Corretora', premio: 'R$ 980,50', status: 'Proposta' },
  { nome: 'Gama Hub', premio: 'R$ 2.115,90', status: 'Emitida' },
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
              <SiTextField v-model="texto" label="Nome" placeholder="Digite…" clearable />
            </VCol>
            <VCol cols="12" md="6">
              <SiSelect v-model="selecionado" :items="opcoes" label="Tipo" clearable />
            </VCol>
            <VCol cols="12">
              <SiTextarea v-model="area" label="Observações" auto-grow />
            </VCol>
            <VCol cols="12" md="4">
              <SiCheckbox v-model="marcado" label="Aceito os termos" />
            </VCol>
            <VCol cols="12" md="4">
              <SiSwitch v-model="ligado" label="Notificações" />
            </VCol>
            <VCol cols="12" md="4">
              <SiRadioGroup v-model="opcao" label="Plano" inline>
                <SiRadio label="A" value="a" />
                <SiRadio label="B" value="b" />
              </SiRadioGroup>
            </VCol>
          </VRow>
          <p class="text-caption text-medium-emphasis mt-2">
            Modelos: {{ { texto, selecionado, marcado, ligado, opcao } }}
          </p>
        </VCardText>
      </SiCard>

      <!-- Formulário (Onda 2) — família de form composta -->
      <SiCard class="mb-6">
        <VCardTitle>Formulário — família de form (Onda 2)</VCardTitle>
        <VCardText>
          <SiForm ref="formRef" v-model="formValido">
            <VRow>
              <VCol cols="12" md="6">
                <SiTextField v-model="fEmail" label="E-mail" :rules="[required(), email()]" />
              </VCol>
              <VCol cols="12" md="6">
                <SiDocField v-model="fDoc" label="CPF/CNPJ" :rules="[required(), cpfCnpj()]" />
              </VCol>
              <VCol cols="12" md="6">
                <SiCurrencyField v-model="fValor" label="Prêmio (BRL)" :rules="[required('Informe o valor')]" />
              </VCol>
              <VCol cols="12" md="6">
                <SiDateField v-model="fData" label="Vigência" :rules="[required('Informe a data')]" />
                <p class="text-caption text-medium-emphasis mt-n2">valor (backend): {{ fData ?? '—' }}</p>
              </VCol>
            </VRow>
            <div class="d-flex align-center mt-2" style="gap: var(--si-space-3)">
              <SiButton @click="enviarForm">Validar e enviar</SiButton>
              <span class="text-caption text-medium-emphasis">Válido: {{ formValido }} · Enviado: {{ enviado }}</span>
            </div>
          </SiForm>
        </VCardText>
      </SiCard>

      <!-- Abas + Expansão -->
      <SiCard class="mb-6">
        <SiTabs v-model="aba">
          <SiTab value="cotacoes" text="Cotações" />
          <SiTab value="propostas" text="Propostas" />
        </SiTabs>
        <VCardText>
          <SiExpansionPanels v-model="painel">
            <SiExpansionPanel title="Detalhes da oferta">
              <template #text>Conteúdo do painel — aba ativa: {{ aba }}.</template>
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
        <SiDataTable :headers="headers" :items="items" />
      </SiCard>

      <!-- Overlays -->
      <SiCard class="mb-6">
        <VCardTitle>Overlays — SiDialog · SiMenu · SiTooltip</VCardTitle>
        <VCardText class="d-flex flex-wrap align-center" style="gap: var(--si-space-3)">
          <SiButton @click="dialogo = true">Abrir diálogo</SiButton>
          <SiDialog v-model="dialogo">
            <SiCard>
              <VCardTitle>Confirmar</VCardTitle>
              <VCardText>Deseja aceitar esta cotação?</VCardText>
              <VCardActions>
                <VSpacer />
                <SiButton variant="text" @click="dialogo = false">Cancelar</SiButton>
                <SiButton @click="dialogo = false">Confirmar</SiButton>
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
            <SiProgressCircular :model-value="progresso" :size="48">{{ progresso }}</SiProgressCircular>
          </div>
          <SiDivider class="my-4" />
          <SiProgressLinear :model-value="progresso" class="mb-2" />
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
