<script setup lang="ts">
/**
 * QuotationGroupsWizard — moldura do fluxo "nova oferta" (protótipo design_handoff_nova_oferta,
 * exec-plan 0015). Fluxo FOCADO: sem o menu de navegação da app. Card com cabeçalho próprio + duas
 * colunas — resumo da oferta à ESQUERDA (carvão, no lugar onde estaria o menu) e o conteúdo do
 * wizard à direita (título + stepper + etapa + navegação). Mobile-first (ADR-017): 1 coluna, resumo
 * colapsável no topo e stepper compacto. Etapas 1–5 entram nos próximos incrementos (placeholder).
 */
import { WIZARD_STEPS } from '~/stores/quotationGroupWizard'
import { extractApiErrorMessage } from '~/lib/apiError'

const wizard = useQuotationGroupWizardStore()
const { isMobile } = useIsMobile()

// A store é singleton da app (ADR-002); nada a limpa ao sair do wizard. Sem isto, voltar a
// /ofertas/nova (link da marca, voltar do navegador) reexibe uma tela de sucesso "Apólice emitida"
// ou dados de uma passagem anterior. Reiniciar ao desmontar garante um começo limpo na próxima
// entrada, sem descartar estado arranjado durante a montagem atual.
onUnmounted(() => {
  wizard.reset()
})

const steps = WIZARD_STEPS.map(step => ({ label: step.label }))
const currentLabel = computed(() => WIZARD_STEPS[wizard.currentStep]?.label ?? '')
const primaryLabel = computed(() => (wizard.isLastStep ? 'Emitir' : 'Continuar'))
// Na emissão (processando/sucesso) o rodapé some — o próprio Step5 mostra as ações.
const showFooter = computed(() => !(wizard.isLastStep && wizard.issuanceState !== 'form'))

const { saveQuotationGroup } = useQuotationGroups()
const stepError = ref<string | null>(null)
const saving = ref(false)

async function onPrimary(): Promise<void> {
  // Validação de FORMA da etapa atual (a de negócio é do servidor — ADR-004).
  const validationError = wizard.validateCurrentStep()
  stepError.value = validationError
  if (validationError) return
  if (wizard.isLastStep) {
    // Último passo: abre o termo de aceite; a emissão (mock) ocorre ao confirmar.
    wizard.termOpen = true
    return
  }
  // Ao sair do passo de risco, salva o grupo de cotação (mock: POST cria / PUT atualiza).
  if (wizard.currentStep === 2) {
    saving.value = true
    try {
      const result = await saveQuotationGroup(
        {
          policyHolderId: wizard.policyHolder?.id ?? null,
          branchId: wizard.selectedBranchId,
          insuredId: wizard.insured?.id ?? null,
          scope: { mode: wizard.scope.mode, insurerIds: wizard.scope.insurerIds },
          risk: {
            modalityId: wizard.risk.modalityId,
            insuredAmount: wizard.risk.insuredAmount,
            startDate: wizard.risk.startDate,
            endDate: wizard.risk.endDate,
            coverageMulta: wizard.risk.coverageMulta,
            coverageLabor: wizard.risk.coverageLabor,
          },
        },
        wizard.quotationGroupId,
      )
      wizard.setQuotationGroupId(result.id)
    }
    catch (err) {
      stepError.value = extractApiErrorMessage(err, 'Não foi possível salvar a oferta. Tente novamente.')
      return
    }
    finally {
      saving.value = false
    }
  }
  wizard.goNext()
}

/** Ao trocar de etapa/fase, leva o usuário suavemente ao topo (perfumaria pedida pelo dono). */
function scrollToTop(): void {
  if (import.meta.client) {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

// Trocar de etapa/fase limpa o erro do rodapé e sobe suavemente para o topo.
watch([() => wizard.currentStep, () => wizard.phase], () => {
  stepError.value = null
  scrollToTop()
})
</script>

<template>
  <div class="si-qg">
    <div class="si-qg__card">
      <QuotationGroupsHeader />

      <div class="si-qg__body">
        <!-- Desktop: resumo em coluna carvão à esquerda. -->
        <QuotationGroupsSummarySidebar
          v-if="!isMobile"
          class="si-qg__summary"
        />

        <div class="si-qg__content">
          <!-- Mobile: resumo colapsável no topo. -->
          <QuotationGroupsSummarySidebar
            v-if="isMobile"
            collapsible
            class="si-qg__summary-mobile"
          />

          <header class="si-qg__title">
            <h1 class="si-qg__title-main">
              Nova oferta
            </h1>
            <p class="si-qg__title-sub">
              Seguro Garantia · cotação e emissão
            </p>
          </header>

          <QuotationGroupsEntryStep v-if="wizard.phase === 'entry'" />

          <template v-else>
            <div class="si-qg__stepper">
              <SiStepper
                v-if="!isMobile"
                v-model:current="wizard.currentStep"
                :steps="steps"
                clickable
              />
              <div
                v-else
                class="si-qg__compact"
              >
                <div class="si-qg__compact-head">
                  <span class="si-qg__compact-label">{{ currentLabel }}</span>
                  <span class="si-qg__compact-count">Passo {{ wizard.currentStep + 1 }} de {{ steps.length }}</span>
                </div>
                <SiProgressLinear
                  :model-value="((wizard.currentStep + 1) / steps.length) * 100"
                  color="primary"
                  :height="4"
                  rounded
                />
              </div>
            </div>

            <SiAlert
              v-if="wizard.signatureChanged && wizard.currentStep <= 2"
              type="warning"
              text="Você alterou dados da oferta — as cotações serão recalculadas ao voltar para a etapa de cotações."
              class="mb-4"
            />

            <section class="si-qg__step">
              <Transition
                name="si-qg-fade"
                mode="out-in"
              >
                <div
                  :key="wizard.currentStep"
                  class="si-qg__step-panel"
                >
                  <QuotationGroupsStep1PolicyHolder v-if="wizard.currentStep === 0" />
                  <QuotationGroupsStep2Insured v-else-if="wizard.currentStep === 1" />
                  <QuotationGroupsStep3Risk v-else-if="wizard.currentStep === 2" />
                  <QuotationGroupsStep4Quotations v-else-if="wizard.currentStep === 3" />
                  <QuotationGroupsStep5Issuance v-else-if="wizard.currentStep === 4" />
                  <QuotationGroupsStepPlaceholder
                    v-else
                    :step-number="wizard.currentStep + 1"
                    :title="currentLabel"
                  />
                </div>
              </Transition>
            </section>

            <SiAlert
              v-if="stepError"
              type="error"
              class="mt-4 mb-0"
              :text="stepError"
            />

            <footer
              v-if="showFooter"
              class="si-qg__nav"
            >
              <SiButton
                variant="outlined"
                color="secondary"
                :prepend-icon="'arrowLeft'"
                @click="wizard.goBack()"
              >
                Voltar
              </SiButton>
              <SiButton
                :append-icon="'arrowRight'"
                :loading="saving"
                @click="onPrimary"
              >
                {{ primaryLabel }}
              </SiButton>
            </footer>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Tela cheia (pedido do dono): ocupa toda a largura e altura da viewport, sem card centralizado. */
.si-qg {
  min-height: 100dvh;
  background: rgb(var(--v-theme-surface));
}

.si-qg__card {
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  background: rgb(var(--v-theme-surface));
  overflow: hidden;
}

.si-qg__body {
  flex: 1 1 auto;
  display: grid;
  grid-template-columns: 320px minmax(0, 1fr);
  align-items: stretch;
}

/* Coluna esquerda (resumo carvão) — ocupa o lugar onde estaria o menu de navegação. */
.si-qg__summary {
  background: rgb(var(--v-theme-charcoal));
  color: rgb(var(--v-theme-on-charcoal));
  padding: var(--si-space-6);
}

.si-qg__content {
  min-width: 0;
  padding: var(--si-space-8);
}

/* Transição leve entre as etapas (perfumaria pedida pelo dono). */
.si-qg-fade-enter-active,
.si-qg-fade-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.si-qg-fade-enter-from {
  opacity: 0;
  transform: translateY(6px);
}

.si-qg-fade-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

.si-qg__title-main {
  margin: 0;
  font-size: var(--si-fs-h2);
  font-weight: var(--si-font-weight-bold);
}

.si-qg__title-sub {
  margin: var(--si-space-1) 0 0;
  color: rgba(var(--v-theme-on-surface), 0.6);
  font-size: var(--si-fs-small);
}

.si-qg__stepper {
  margin-block: var(--si-space-5);
}

.si-qg__compact-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--si-space-2);
  margin-bottom: var(--si-space-2);
}

.si-qg__compact-label {
  font-weight: var(--si-font-weight-semibold);
}

.si-qg__compact-count {
  font-size: var(--si-fs-caption);
  color: var(--si-cinza);
  white-space: nowrap;
}

.si-qg__summary-mobile {
  margin-bottom: var(--si-space-4);
}

.si-qg__nav {
  display: flex;
  justify-content: space-between;
  gap: var(--si-space-3);
  margin-top: var(--si-space-6);
  padding-top: var(--si-space-5);
  border-top: 1px solid var(--si-cinza-claro);
}

/* Mobile-first (ADR-017): abaixo do breakpoint do shell (1024) empilha em coluna única. */
@media (max-width: 1023.98px) {
  .si-qg__body {
    grid-template-columns: 1fr;
  }

  .si-qg__content {
    padding: var(--si-space-6);
  }

  .si-qg__title-main {
    font-size: var(--si-fs-h3);
  }
}
</style>
