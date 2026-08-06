<script setup lang="ts">
/**
 * Detalhe da Cotação (RN-081), read-only. Página fina (ADR-018): busca a Cotação pelo id (guid) e orquestra
 * cabeçalho + card de situação (full-width, só pronta/ccg) + corpo em duas colunas (aba Resumo da proposta +
 * Cronologia). A situação apresentada (pill) vem de `lib/status/quotations` (fonte única, eixo-1); o card de
 * situação, do view-model de detalhe. Emitir e Cancelar são visíveis mas inertes nesta fatia. Desktop e mobile.
 */
import type { QuotationDetail } from '~/composables/useQuotationDetail'
import { getQuotationSituationView } from '~/lib/status/quotations'
import { getDetailSituationView } from '~/lib/quotations/detailView'
import { initials } from '~/lib/format'
import { toBrDateTime } from '~/lib/dates'
import { extractApiErrorMessage } from '~/lib/apiError'

definePageMeta({ layout: 'shell' })

const route = useRoute()
const { getQuotation } = useQuotationDetail()
const { isMobile } = useIsMobile()
const returnTo = useQuotationBookReturn()

const quotation = ref<QuotationDetail | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)
const notFound = ref(false)
const tab = ref('resumo')
const snack = ref<{ message: string, variant: 'success' | 'info' | 'warning' | 'error' } | null>(null)

const situationView = computed(() =>
  quotation.value ? getQuotationSituationView(quotation.value.result) : null)

const detailSituation = computed(() =>
  quotation.value
    ? getDetailSituationView(
      quotation.value.result,
      quotation.value.requiresCcg,
      quotation.value.ccgSigned,
      toBrDateTime(quotation.value.createdAt),
    )
    : null)

await load()

async function load() {
  loading.value = true
  error.value = null
  notFound.value = false
  try {
    quotation.value = await getQuotation(String(route.params.id))
  }
  catch (err: unknown) {
    if ((err as { statusCode?: number })?.statusCode === 404) {
      notFound.value = true
    }
    else {
      error.value = extractApiErrorMessage(err, 'Não foi possível carregar a cotação.')
    }
  }
  finally {
    loading.value = false
  }
}

async function copyNumber() {
  const number = quotation.value?.number
  if (!number) {
    return
  }
  try {
    await navigator.clipboard.writeText(number)
    snack.value = { message: 'Número da cotação copiado.', variant: 'success' }
  }
  catch {
    snack.value = { message: 'Não foi possível copiar o número.', variant: 'error' }
  }
}
</script>

<template>
  <div class="si-qd">
    <!-- Estado: carregando -->
    <div
      v-if="loading"
      class="si-qd__state"
    >
      <SiProgressCircular indeterminate />
    </div>

    <!-- Estado: cotação não encontrada (404 / fora do escopo — não distingue) -->
    <div
      v-else-if="notFound"
      class="si-qd__state"
    >
      <div class="si-qd__state-icon">
        <SiIcon icon="search" />
      </div>
      <h2 class="si-qd__state-title">
        Cotação não encontrada
      </h2>
      <p class="si-qd__state-text">
        Ela pode ter sido removida ou pertencer a outra corretora. Volte para o livro de cotações.
      </p>
      <SiButton
        :to="returnTo"
        :prepend-icon="'chevronLeft'"
      >
        Voltar para cotações
      </SiButton>
    </div>

    <!-- Estado: erro (com retry) -->
    <div
      v-else-if="error"
      class="si-qd__state"
    >
      <div class="si-qd__state-icon si-qd__state-icon--danger">
        <SiIcon icon="alertTriangle" />
      </div>
      <h2 class="si-qd__state-title">
        Não foi possível carregar a cotação
      </h2>
      <p class="si-qd__state-text">
        {{ error }}
      </p>
      <SiButton
        :prepend-icon="'refresh'"
        @click="load"
      >
        Tentar novamente
      </SiButton>
    </div>

    <!-- Dados -->
    <template v-else-if="quotation">
      <!-- Cabeçalho: transparente no desktop (sobre --si-fundo), escuro no mobile -->
      <header
        class="si-qd__header"
        :class="{ 'si-qd__header--dark': isMobile }"
      >
        <div class="si-qd__header-inner">
          <SiPageBack
            :to="returnTo"
            parent-label="Cotações"
            :current="quotation.number ?? 'Detalhe'"
            class="si-qd__back"
          />

          <div class="si-qd__hero">
            <div class="si-qd__identity">
              <SiAvatar
                v-if="!isMobile"
                size="lg"
                rounded="lg"
                color="charcoal"
                class="si-qd__avatar"
              >
                {{ initials(quotation.policyHolderName) }}
              </SiAvatar>

              <div class="si-qd__headings">
                <span
                  v-if="isMobile"
                  class="si-qd__eyebrow"
                >Cotação</span>
                <div class="si-qd__title-row">
                  <h1 class="si-qd__title">
                    {{ quotation.policyHolderName }}
                  </h1>
                  <SiChip
                    v-if="situationView"
                    :color="situationView.color"
                    size="small"
                  >
                    {{ situationView.label }}
                  </SiChip>
                  <SiChip
                    v-if="quotation.requiresCcg"
                    color="info"
                    size="x-small"
                    title="Exige contragarantia (CCG)"
                  >
                    Pendência de CCG
                  </SiChip>
                </div>

                <div class="si-qd__meta">
                  <span class="si-qd__meta-number">Cotação {{ quotation.number ?? '—' }}</span>
                  <SiIconButton
                    v-if="quotation.number"
                    icon="copy"
                    size="x-small"
                    aria-label="Copiar número da cotação"
                    @click="copyNumber"
                  />
                  <span class="si-qd__meta-sep">·</span>
                  <span>{{ quotation.insurerName }}</span>
                  <span class="si-qd__meta-sep">·</span>
                  <span>{{ quotation.modalityName }}</span>
                </div>
              </div>
            </div>

            <!-- Ações (desktop): visíveis mas inertes nesta fatia -->
            <div
              v-if="!isMobile && detailSituation?.showActions"
              class="si-qd__actions"
            >
              <SiButton
                variant="text"
                color="error"
              >
                Cancelar cotação
              </SiButton>
              <SiButton>
                Emitir apólice
              </SiButton>
            </div>
          </div>
        </div>
      </header>

      <div class="si-qd__body">
        <!-- Card de situação: FULL WIDTH, acima do corpo em colunas -->
        <QuotationsSituationCard
          v-if="detailSituation?.hasSituationCard"
          :view="detailSituation"
          :orientation="isMobile ? 'vertical' : 'horizontal'"
        />

        <!-- Ações (mobile): empilhadas, largura total -->
        <div
          v-if="isMobile && detailSituation?.showActions"
          class="si-qd__actions si-qd__actions--stacked"
        >
          <SiButton block>
            Emitir apólice
          </SiButton>
          <SiButton
            block
            variant="outlined"
            color="error"
          >
            Cancelar cotação
          </SiButton>
        </div>

        <div class="si-qd__grid">
          <div class="si-qd__main">
            <SiTabs
              v-model="tab"
              class="si-qd__tabs"
            >
              <SiTab
                value="resumo"
                text="Resumo da proposta"
              />
            </SiTabs>

            <QuotationsDetailSummary :quotation="quotation" />
          </div>

          <aside class="si-qd__aside">
            <QuotationsTimeline
              :events="quotation.timeline"
              :collapsible="isMobile"
            />
          </aside>
        </div>
      </div>
    </template>

    <SiSnackbar
      v-if="snack"
      :model-value="true"
      :variant="snack.variant"
      :timeout="3600"
      @update:model-value="snack = null"
    >
      {{ snack.message }}
    </SiSnackbar>
  </div>
</template>

<style scoped>
.si-qd {
  min-height: 100%;
  background: rgb(var(--v-theme-background));
}

.si-qd__state {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: var(--si-space-3);
  padding: 96px 24px;
}

.si-qd__state-icon {
  display: grid;
  place-items: center;
  width: 52px;
  height: 52px;
  border-radius: var(--si-radius-pill);
  background: var(--si-cinza-claro);
  color: var(--si-cinza);
}

.si-qd__state-icon--danger {
  background: rgba(var(--v-theme-error), 0.1);
  color: rgb(var(--v-theme-error));
}

.si-qd__state-title {
  margin: 0;
  font-size: var(--si-fs-h4);
  font-weight: var(--si-font-weight-semibold);
}

.si-qd__state-text {
  margin: 0;
  max-width: 420px;
  color: var(--si-cinza);
  font-size: var(--si-fs-small);
}

/* Larguras: cabeçalho e corpo compartilham o mesmo eixo central e recuo lateral. */
.si-qd__header-inner,
.si-qd__body {
  max-width: var(--si-container-wide);
  margin-inline: auto;
  padding-inline: 32px;
}

.si-qd__header-inner {
  padding-block: 24px 0;
}

/* Mobile: cabeçalho escuro edge-to-edge (charcoal do tema). */
.si-qd__header--dark {
  background: rgb(var(--v-theme-charcoal));
}

.si-qd__header--dark .si-qd__title,
.si-qd__header--dark .si-qd__meta-number {
  color: rgb(var(--v-theme-on-charcoal));
}

.si-qd__header--dark .si-qd__meta,
.si-qd__header--dark .si-qd__eyebrow {
  color: rgba(var(--v-theme-on-charcoal), 0.65);
}

.si-qd__hero {
  display: flex;
  justify-content: space-between;
  gap: var(--si-space-6);
  flex-wrap: wrap;
  margin-top: var(--si-space-4);
}

.si-qd__identity {
  display: flex;
  gap: var(--si-space-4);
  flex: 1 1 460px;
  min-width: 0;
}

.si-qd__avatar {
  flex-shrink: 0;
  color: rgb(var(--v-theme-primary));
  font-weight: var(--si-font-weight-bold);
}

.si-qd__headings {
  display: flex;
  flex-direction: column;
  gap: var(--si-space-2);
  min-width: 0;
}

.si-qd__eyebrow {
  text-transform: uppercase;
  letter-spacing: 0.12em;
  font-size: 11px;
  font-weight: var(--si-font-weight-semibold);
  color: var(--si-cinza);
}

.si-qd__title-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--si-space-3);
}

.si-qd__title {
  margin: 0;
  font-size: 24px;
  line-height: 1.2;
  letter-spacing: -0.02em;
  font-weight: var(--si-font-weight-semibold);
  text-wrap: pretty;
}

.si-qd__meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--si-space-2);
  color: var(--si-cinza);
  font-size: 13.5px;
}

.si-qd__meta-number {
  font-variant-numeric: tabular-nums;
}

.si-qd__meta-sep {
  color: var(--si-cinza-claro);
}

.si-qd__actions {
  display: flex;
  align-items: center;
  gap: var(--si-space-2);
  flex-shrink: 0;
}

.si-qd__actions--stacked {
  flex-direction: column;
  align-items: stretch;
  gap: var(--si-space-2);
}

.si-qd__body {
  display: flex;
  flex-direction: column;
  gap: var(--si-space-5);
  padding-block: var(--si-space-5) 40px;
}

.si-qd__grid {
  display: grid;
  grid-template-columns: minmax(0, 1.55fr) minmax(0, 1fr);
  gap: var(--si-space-5);
  align-items: start;
}

.si-qd__main {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.si-qd__tabs {
  margin-bottom: var(--si-space-4);
  border-bottom: 1px solid var(--si-cinza-claro);
}

.si-qd__aside {
  position: sticky;
  top: 20px;
}

@media (max-width: 1023.98px) {
  .si-qd__header-inner {
    padding: 14px 16px 16px;
  }

  .si-qd__body {
    padding-inline: 16px;
    padding-block: var(--si-space-4);
    gap: var(--si-space-4);
  }

  .si-qd__grid {
    grid-template-columns: 1fr;
    gap: var(--si-space-4);
  }

  .si-qd__aside {
    position: static;
  }
}
</style>
