<script setup lang="ts">
/**
 * Matriz Seguradoras × Modalidades (RN-033: a Modalidade é o eixo; duas ofertas só são "a mesma
 * modalidade" quando ambas as Modalidades Importadas confirmam para ela). Apresentacional
 * (ADR-018): recebe as entradas por prop, não decide nada. `offered` (é ofertada) e `branches`
 * (ramos) são derivados no servidor (RN-033) — o cliente só renderiza, por nome estável (ADR-004).
 * Mobile-first (ADR-017): desktop = tabela densa; mobile = cards empilhados.
 */
import type { ModalityMapEntry } from '~/composables/useModalityMap'
import { getModalityStatusView } from '~/lib/status/modalities'
import { getSuretyBranchView } from '~/lib/status/suretyBranches'

defineProps<{
  entries: ModalityMapEntry[]
  loading?: boolean
}>()

const { mobile } = useDisplay()

const headers = [
  { title: 'Modalidade', key: 'name' },
  { title: 'Grupo de Modalidade', key: 'groupName' },
  { title: 'Situação', key: 'status', align: 'center' },
  { title: 'Ofertada', key: 'offered', align: 'center' },
  { title: 'Ramos', key: 'branches' },
  { title: 'Seguradoras', key: 'insurers' },
] as const
</script>

<template>
  <!-- Desktop: tabela densa -->
  <SiDataTable
    v-if="!mobile"
    :headers="headers"
    :items="entries"
    :loading="loading"
    :items-per-page="20"
    density="compact"
    class="si-modality-map-matrix"
  >
    <template #[`item.status`]="{ item }">
      <div class="si-modality-map-matrix__center">
        <SiChip
          :color="getModalityStatusView(item.status).color"
          size="small"
        >
          {{ getModalityStatusView(item.status).label }}
        </SiChip>
      </div>
    </template>

    <template #[`item.offered`]="{ item }">
      <div class="si-modality-map-matrix__center">
        <SiChip
          :color="item.offered ? 'success' : 'default'"
          size="small"
          variant="tonal"
        >
          {{ item.offered ? 'Ofertada' : 'Fora de operação' }}
        </SiChip>
      </div>
    </template>

    <template #[`item.branches`]="{ item }">
      <div class="si-modality-map-matrix__chips">
        <template v-if="item.branches.length">
          <SiChip
            v-for="branch in item.branches"
            :key="branch"
            :color="getSuretyBranchView(branch).color"
            size="x-small"
            variant="tonal"
          >
            {{ getSuretyBranchView(branch).label }}
          </SiChip>
        </template>
        <span
          v-else
          class="si-modality-map-matrix__muted"
        >-</span>
      </div>
    </template>

    <template #[`item.insurers`]="{ item }">
      <div class="si-modality-map-matrix__chips">
        <template v-if="item.insurers.length">
          <SiChip
            v-for="insurer in item.insurers"
            :key="insurer.importedModalityId"
            size="x-small"
            variant="outlined"
          >
            {{ insurer.insurerName }}
          </SiChip>
        </template>
        <span
          v-else
          class="si-modality-map-matrix__muted"
        >Nenhuma Seguradora</span>
      </div>
    </template>

    <template #no-data>
      Nenhuma Modalidade no catálogo.
    </template>
  </SiDataTable>

  <!-- Mobile: cards empilhados (ADR-017) -->
  <div
    v-else
    class="si-modality-map-cards"
  >
    <SiProgressLinear
      v-if="loading"
      indeterminate
    />

    <p
      v-if="!entries.length && !loading"
      class="si-modality-map-cards__empty"
    >
      Nenhuma Modalidade no catálogo.
    </p>

    <SiCard
      v-for="entry in entries"
      :key="entry.modalityId"
      variant="outlined"
      class="si-modality-map-cards__item"
    >
      <div class="si-modality-map-cards__head">
        <span class="si-modality-map-cards__name">{{ entry.name }}</span>
        <SiChip
          :color="getModalityStatusView(entry.status).color"
          size="small"
        >
          {{ getModalityStatusView(entry.status).label }}
        </SiChip>
      </div>

      <dl class="si-modality-map-cards__facts">
        <div class="si-modality-map-cards__fact">
          <dt>Grupo de Modalidade</dt>
          <dd>{{ entry.groupName }}</dd>
        </div>
        <div class="si-modality-map-cards__fact">
          <dt>Ofertada</dt>
          <dd>{{ entry.offered ? 'Sim' : 'Fora de operação' }}</dd>
        </div>
        <div class="si-modality-map-cards__fact">
          <dt>Ramos</dt>
          <dd>
            <span
              v-if="!entry.branches.length"
              class="si-modality-map-matrix__muted"
            >-</span>
            <SiChip
              v-for="branch in entry.branches"
              :key="branch"
              :color="getSuretyBranchView(branch).color"
              size="x-small"
              variant="tonal"
              class="ml-1"
            >
              {{ getSuretyBranchView(branch).label }}
            </SiChip>
          </dd>
        </div>
      </dl>

      <div class="si-modality-map-cards__insurers">
        <span
          v-if="!entry.insurers.length"
          class="si-modality-map-matrix__muted"
        >Nenhuma Seguradora</span>
        <SiChip
          v-for="insurer in entry.insurers"
          :key="insurer.importedModalityId"
          size="x-small"
          variant="outlined"
        >
          {{ insurer.insurerName }}
        </SiChip>
      </div>
    </SiCard>
  </div>
</template>

<style scoped>
.si-modality-map-matrix__center {
  display: flex;
  align-items: center;
  justify-content: center;
}

.si-modality-map-matrix__chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--si-space-1);
  padding-block: var(--si-space-1);
}

.si-modality-map-matrix__muted {
  color: rgba(var(--v-theme-on-surface), 0.6);
  font-size: var(--si-fs-small);
}

.si-modality-map-cards {
  display: flex;
  flex-direction: column;
  gap: var(--si-space-3);
  padding: var(--si-space-3);
}

.si-modality-map-cards__empty {
  text-align: center;
  color: rgba(var(--v-theme-on-surface), 0.6);
  padding: var(--si-space-6) 0;
}

.si-modality-map-cards__item {
  padding: var(--si-space-4);
}

.si-modality-map-cards__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--si-space-2);
  margin-bottom: var(--si-space-3);
}

.si-modality-map-cards__name {
  font-weight: var(--si-font-weight-semibold);
}

.si-modality-map-cards__facts {
  display: flex;
  flex-direction: column;
  gap: var(--si-space-2);
  margin: 0 0 var(--si-space-3);
}

.si-modality-map-cards__fact {
  display: flex;
  justify-content: space-between;
  gap: var(--si-space-3);
  font-size: var(--si-fs-small);
}

.si-modality-map-cards__fact dt {
  color: rgba(var(--v-theme-on-surface), 0.6);
}

.si-modality-map-cards__fact dd {
  margin: 0;
  text-align: right;
}

.si-modality-map-cards__insurers {
  display: flex;
  flex-wrap: wrap;
  gap: var(--si-space-1);
}
</style>
