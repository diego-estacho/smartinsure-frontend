<script setup lang="ts">
/**
 * Catálogo canônico de Coberturas Adicionais (RN-040) com as Coberturas Adicionais Importadas
 * Ativas vinculadas (RN-043/RN-046) — o eixo é a Cobertura Adicional canônica; cada linha mostra
 * as importadas vinculadas (de Seguradoras/Modalidades diferentes podem apontar para a mesma
 * canônica). Apresentacional (ADR-018): recebe as entradas por prop e emite intenções
 * (`edit`, `change-status`, `unlink`); nenhuma regra de negócio no cliente — a disponibilidade
 * (RN-046) e o vínculo são derivados/decididos no servidor. Situação por nome estável (ADR-004).
 * Mobile-first (ADR-017): desktop = tabela densa; mobile = cards empilhados.
 */
import type { CanonicalCoverageItem, LinkedCoverageItem } from '~/composables/useAdditionalCoverageMap'
import { getAdditionalCoverageStatusAction, getAdditionalCoverageStatusView } from '~/lib/status/additionalCoverages'

defineProps<{
  coverages: CanonicalCoverageItem[]
  loading?: boolean
  busy?: boolean
}>()

const emit = defineEmits<{
  'edit': [item: CanonicalCoverageItem]
  'change-status': [item: CanonicalCoverageItem]
  'unlink': [linked: LinkedCoverageItem]
}>()

const { mobile } = useDisplay()

const headers = [
  { title: 'Cobertura Adicional', key: 'name' },
  { title: 'Situação', key: 'status', align: 'center' },
  { title: 'Coberturas Adicionais Importadas vinculadas', key: 'linked' },
  { title: 'Ações', key: 'actions', sortable: false, align: 'center' },
] as const
</script>

<template>
  <!-- Desktop: tabela densa -->
  <SiDataTable
    v-if="!mobile"
    :headers="headers"
    :items="coverages"
    :loading="loading"
    :items-per-page="20"
    density="compact"
    class="si-additional-coverage-matrix"
  >
    <template #[`item.status`]="{ item }">
      <div class="si-additional-coverage-matrix__center">
        <SiChip
          :color="getAdditionalCoverageStatusView(item.status).color"
          size="small"
        >
          {{ getAdditionalCoverageStatusView(item.status).label }}
        </SiChip>
      </div>
    </template>

    <template #[`item.linked`]="{ item }">
      <div class="si-additional-coverage-matrix__linked">
        <span
          v-if="!item.linked.length"
          class="si-additional-coverage-matrix__muted"
        >Nenhuma Cobertura Adicional Importada vinculada</span>

        <div
          v-for="linked in item.linked"
          :key="linked.importedCoverageId"
          class="si-additional-coverage-matrix__linked-row"
        >
          <SiTooltip location="top">
            <template #activator="{ props }">
              <SiChip
                v-bind="props"
                size="x-small"
                variant="outlined"
              >
                {{ linked.coverageName }}
              </SiChip>
            </template>

            <div class="si-additional-coverage-matrix__origin">
              <strong>{{ linked.coverageName }}</strong>
              <span>{{ linked.insurerName }}</span>
              <span>{{ linked.modalityName }}</span>
            </div>
          </SiTooltip>

          <span class="si-additional-coverage-matrix__linked-meta">
            {{ linked.insurerName }} · {{ linked.modalityName }}
          </span>

          <SiButton
            :prepend-icon="'close'"
            size="x-small"
            variant="text"
            color="secondary"
            :disabled="busy"
            @click="emit('unlink', linked)"
          >
            Desvincular
          </SiButton>
        </div>
      </div>
    </template>

    <template #[`item.actions`]="{ item }">
      <div class="si-additional-coverage-matrix__center">
        <SiButton
          :prepend-icon="'pencil'"
          size="small"
          variant="tonal"
          color="info"
          @click="emit('edit', item)"
        >
          Editar
        </SiButton>

        <SiButton
          :prepend-icon="getAdditionalCoverageStatusAction(item.status).icon"
          size="small"
          variant="tonal"
          :color="getAdditionalCoverageStatusAction(item.status).color"
          :disabled="getAdditionalCoverageStatusAction(item.status).disabled"
          @click="emit('change-status', item)"
        >
          {{ getAdditionalCoverageStatusAction(item.status).shortLabel }}
        </SiButton>
      </div>
    </template>

    <template #no-data>
      Nenhuma Cobertura Adicional no catálogo.
    </template>
  </SiDataTable>

  <!-- Mobile: cards empilhados (ADR-017) -->
  <div
    v-else
    class="si-additional-coverage-cards"
  >
    <SiProgressLinear
      v-if="loading"
      indeterminate
    />

    <p
      v-if="!coverages.length && !loading"
      class="si-additional-coverage-cards__empty"
    >
      Nenhuma Cobertura Adicional no catálogo.
    </p>

    <SiCard
      v-for="item in coverages"
      :key="item.id"
      variant="outlined"
      class="si-additional-coverage-cards__item"
    >
      <div class="si-additional-coverage-cards__head">
        <span class="si-additional-coverage-cards__name">{{ item.name }}</span>
        <SiChip
          :color="getAdditionalCoverageStatusView(item.status).color"
          size="small"
        >
          {{ getAdditionalCoverageStatusView(item.status).label }}
        </SiChip>
      </div>

      <div class="si-additional-coverage-cards__linked">
        <span
          v-if="!item.linked.length"
          class="si-additional-coverage-matrix__muted"
        >Nenhuma Cobertura Adicional Importada vinculada</span>

        <div
          v-for="linked in item.linked"
          :key="linked.importedCoverageId"
          class="si-additional-coverage-matrix__linked-row"
        >
          <SiChip
            size="x-small"
            variant="outlined"
          >
            {{ linked.coverageName }}
          </SiChip>
          <span class="si-additional-coverage-matrix__linked-meta">
            {{ linked.insurerName }} · {{ linked.modalityName }}
          </span>
          <SiButton
            :prepend-icon="'close'"
            size="x-small"
            variant="text"
            color="secondary"
            :disabled="busy"
            @click="emit('unlink', linked)"
          >
            Desvincular
          </SiButton>
        </div>
      </div>

      <div class="si-additional-coverage-cards__actions">
        <SiButton
          :prepend-icon="'pencil'"
          size="small"
          variant="tonal"
          color="info"
          @click="emit('edit', item)"
        >
          Editar
        </SiButton>

        <SiButton
          :prepend-icon="getAdditionalCoverageStatusAction(item.status).icon"
          size="small"
          variant="tonal"
          :color="getAdditionalCoverageStatusAction(item.status).color"
          :disabled="getAdditionalCoverageStatusAction(item.status).disabled"
          @click="emit('change-status', item)"
        >
          {{ getAdditionalCoverageStatusAction(item.status).shortLabel }}
        </SiButton>
      </div>
    </SiCard>
  </div>
</template>

<style scoped>
.si-additional-coverage-matrix__center {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--si-space-2);
}

.si-additional-coverage-matrix__muted {
  color: rgba(var(--v-theme-on-surface), 0.6);
  font-size: var(--si-fs-small);
}

.si-additional-coverage-matrix__linked {
  display: flex;
  flex-direction: column;
  gap: var(--si-space-1);
  padding-block: var(--si-space-1);
}

.si-additional-coverage-matrix__linked-row {
  display: flex;
  align-items: center;
  gap: var(--si-space-2);
  flex-wrap: wrap;
}

.si-additional-coverage-matrix__linked-meta {
  color: rgba(var(--v-theme-on-surface), 0.7);
  font-size: var(--si-fs-small);
}

.si-additional-coverage-matrix__origin {
  display: flex;
  flex-direction: column;
  gap: var(--si-space-1);
  max-width: 22rem;
}

.si-additional-coverage-matrix__origin span {
  color: rgba(var(--v-theme-on-surface), 0.7);
  font-size: var(--si-fs-small);
}

.si-additional-coverage-cards {
  display: flex;
  flex-direction: column;
  gap: var(--si-space-3);
  padding: var(--si-space-3);
}

.si-additional-coverage-cards__empty {
  text-align: center;
  color: rgba(var(--v-theme-on-surface), 0.6);
  padding: var(--si-space-6) 0;
}

.si-additional-coverage-cards__item {
  padding: var(--si-space-4);
}

.si-additional-coverage-cards__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--si-space-2);
  margin-bottom: var(--si-space-3);
}

.si-additional-coverage-cards__name {
  font-weight: var(--si-font-weight-semibold);
}

.si-additional-coverage-cards__linked {
  display: flex;
  flex-direction: column;
  gap: var(--si-space-2);
  margin-bottom: var(--si-space-3);
}

.si-additional-coverage-cards__actions {
  display: flex;
  gap: var(--si-space-2);
}

.si-additional-coverage-cards__actions > * {
  flex: 1 1 0;
}
</style>
