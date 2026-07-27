<script setup lang="ts">
/**
 * Tela de entrada (escopo de cotação) — MOCK (exec-plan 0015). Define se a oferta cota todas as
 * seguradoras ou um subconjunto; o escopo acompanha o QuotationGroup e filtra o ranking na etapa 4.
 * Renderiza dentro da coluna de conteúdo do wizard (sem card próprio). O grid de seguradoras é mock
 * (fixtures do handoff); a lista real vem do backend depois. TODO(backend): substituir mockInsurers.
 */
import type { QuotationScopeMode } from '~/stores/quotationGroupWizard'

const wizard = useQuotationGroupWizardStore()

// MOCK: nomes reais do fluxo atual; logos são placeholder — não embarcar logotipo de terceiro.
const mockInsurers = [
  { id: 'newe', name: 'Newe Seguros' },
  { id: 'sancor', name: 'Sancor Seguros' },
  { id: 'mitsui', name: 'Mitsui Sumitomo' },
  { id: 'essor', name: 'Essor Seguros' },
  { id: 'berkley', name: 'Berkley' },
]

const error = ref<string | null>(null)

// Proxy tipado: o v-model do SiRadioGroup é `unknown`; mantém `scope.mode` estrito.
const mode = computed<QuotationScopeMode>({
  get: () => wizard.scope.mode,
  set: value => (wizard.scope.mode = value),
})

function isSelected(id: string): boolean {
  return wizard.scope.insurerIds.includes(id)
}

function toggleInsurer(id: string): void {
  const ids = wizard.scope.insurerIds
  const index = ids.indexOf(id)
  if (index === -1) ids.push(id)
  else ids.splice(index, 1)
}

function start(): void {
  error.value = wizard.startOffer()
    ? null
    : 'Selecione ao menos uma seguradora para continuar.'
}
</script>

<template>
  <div class="si-qg-entry">
    <h2 class="si-qg-entry__q">
      Como você quer cotar esta oferta?
    </h2>
    <p class="si-qg-entry__hint">
      Cote com todo o mercado para comparar as melhores condições, ou selecione as seguradoras de sua preferência.
    </p>

    <SiRadioGroup v-model="mode">
      <SiRadio value="all">
        <template #label>
          <span class="si-qg-entry__opt">
            <span class="si-qg-entry__opt-title">Cotar todas as seguradoras (recomendado)</span>
            <span class="si-qg-entry__opt-desc">O motor consulta o mercado e retorna o ranking das seguradoras disponíveis.</span>
          </span>
        </template>
      </SiRadio>
      <SiRadio value="specific">
        <template #label>
          <span class="si-qg-entry__opt">
            <span class="si-qg-entry__opt-title">Escolher seguradoras específicas</span>
            <span class="si-qg-entry__opt-desc">Selecione uma ou mais seguradoras para cotar e comparar.</span>
          </span>
        </template>
      </SiRadio>
    </SiRadioGroup>

    <div
      v-if="mode === 'specific'"
      class="si-qg-entry__grid"
    >
      <button
        v-for="insurer in mockInsurers"
        :key="insurer.id"
        type="button"
        class="si-qg-entry__insurer"
        :class="{ 'si-qg-entry__insurer--on': isSelected(insurer.id) }"
        @click="toggleInsurer(insurer.id)"
      >
        <SiCheckbox
          :model-value="isSelected(insurer.id)"
          hide-details
          readonly
          tabindex="-1"
        />
        <SiAvatar :size="32">
          <SiIcon
            icon="building"
            :size="18"
          />
        </SiAvatar>
        <span class="si-qg-entry__insurer-name">{{ insurer.name }}</span>
      </button>
    </div>

    <SiAlert
      v-if="error"
      type="error"
      class="mt-3 mb-0"
      :text="error"
    />

    <div class="si-qg-entry__actions">
      <SiButton
        :append-icon="'arrowRight'"
        @click="start"
      >
        Iniciar oferta
      </SiButton>
    </div>
  </div>
</template>

<style scoped>
.si-qg-entry__q {
  margin: var(--si-space-4) 0 var(--si-space-1);
  font-size: var(--si-fs-h4);
  font-weight: var(--si-font-weight-semibold);
}

.si-qg-entry__hint {
  margin: 0 0 var(--si-space-3);
  color: rgba(var(--v-theme-on-surface), 0.6);
  font-size: var(--si-fs-small);
}

.si-qg-entry__opt {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.si-qg-entry__opt-title {
  font-weight: var(--si-font-weight-medium);
}

.si-qg-entry__opt-desc {
  font-size: var(--si-fs-caption);
  color: rgba(var(--v-theme-on-surface), 0.6);
}

.si-qg-entry__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: var(--si-space-2);
  margin-top: var(--si-space-2);
}

.si-qg-entry__insurer {
  display: flex;
  align-items: center;
  gap: var(--si-space-2);
  padding: var(--si-space-2) var(--si-space-3);
  border: 1px solid var(--si-cinza-claro);
  border-radius: var(--si-radius-md);
  background: rgb(var(--v-theme-surface));
  cursor: pointer;
  font: inherit;
  text-align: start;
  transition:
    border-color var(--si-dur-fast) var(--si-ease-out),
    background-color var(--si-dur-fast) var(--si-ease-out);
}

.si-qg-entry__insurer:hover {
  border-color: rgb(var(--v-theme-primary));
}

.si-qg-entry__insurer--on {
  border-color: rgb(var(--v-theme-primary));
  background: rgba(var(--v-theme-primary), 0.06);
}

.si-qg-entry__insurer-name {
  font-size: var(--si-fs-small);
  font-weight: var(--si-font-weight-medium);
}

.si-qg-entry__actions {
  display: flex;
  justify-content: flex-end;
  margin-top: var(--si-space-6);
  padding-top: var(--si-space-5);
  border-top: 1px solid var(--si-cinza-claro);
}
</style>
