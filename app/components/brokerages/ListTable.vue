<script setup lang="ts">
/**
 * Tabela de Corretoras (RN-018) — apresentacional. Recebe a página já resolvida pelo
 * servidor e emite as ações; os estados carregando/vazio/erro são orquestrados pela página.
 */
import type { BrokerageListItem } from '~/composables/useBrokerages'
import { formatCnpj } from '~/lib/documents'
import { getBrokerageSituationView } from '~/lib/status/brokerages'

defineProps<{
  items: BrokerageListItem[]
  loading: boolean
}>()

const { isMobile } = useIsMobile()

const emit = defineEmits<{
  open: [item: BrokerageListItem]
  view: [item: BrokerageListItem]
  edit: [item: BrokerageListItem]
  enable: [item: BrokerageListItem]
  inactivate: [item: BrokerageListItem]
}>()

const headers = [
  { title: 'Corretora', key: 'name' },
  { title: 'Seguradoras', key: 'insurers', sortable: false },
  { title: 'Motor', key: 'engine', sortable: false },
  { title: 'Cadastro', key: 'registeredAt' },
  { title: 'Situação', key: 'situation', sortable: false },
  { title: '', key: 'actions', sortable: false, align: 'end' },
] as const

function initials(item: BrokerageListItem) {
  const source = item.socialName || item.name || ''
  return source
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(word => word[0])
    .join('')
    .toUpperCase()
}

function insurersSummary(item: BrokerageListItem) {
  const names = item.enabledInsurerNames ?? []
  if (names.length === 0) return 'Sem habilitação'
  const shown = names.slice(0, 2).join(', ')
  const extra = names.length - 2
  return extra > 0 ? `${shown} +${extra}` : shown
}

function engineLabel(item: BrokerageListItem) {
  return item.calculationEngines?.[0] ?? '—'
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('pt-BR')
}

function onRowClick(_event: unknown, ctx: { item: BrokerageListItem }) {
  emit('open', ctx.item)
}
</script>

<template>
  <div class="si-brokerage-list">
    <!-- Mobile (< 1024px): cartões. O toque no cartão abre o detalhe; o menu "…" traz as
         demais ações. Alvos ≥ 44px (skin global). -->
    <template v-if="isMobile">
      <SiProgressLinear
        v-if="loading"
        indeterminate
        class="si-brokerage-cards__progress"
      />
      <ul class="si-brokerage-cards">
        <li
          v-for="item in items"
          :key="item.id"
          class="si-brokerage-cards__item"
        >
          <button
            type="button"
            class="si-brokerage-cards__main"
            @click="emit('open', item)"
          >
            <SiAvatar
              size="sm"
              rounded="lg"
            >
              {{ initials(item) }}
            </SiAvatar>
            <span class="si-brokerage-cards__identity">
              <span class="si-cell-strong">{{ item.socialName || item.name }}</span>
              <span class="si-brokerage-list__meta">{{ formatCnpj(item.documentNumber) }}</span>
            </span>
            <SiChip
              :color="getBrokerageSituationView(item.situation).color"
              size="small"
            >
              {{ getBrokerageSituationView(item.situation).label }}
            </SiChip>
          </button>
          <div class="si-brokerage-cards__facts">
            <span>{{ item.enabledInsurerCount }} seguradora{{ item.enabledInsurerCount === 1 ? '' : 's' }} · {{ insurersSummary(item) }}</span>
            <span>{{ engineLabel(item) }} · {{ formatDate(item.registeredAt) }}</span>
          </div>
          <div class="si-brokerage-cards__actions">
            <SiButton
              variant="text"
              size="small"
              @click="emit('view', item)"
            >
              Ver detalhes
            </SiButton>
            <SiMenu location="bottom end">
              <template #activator="{ props }">
                <SiIconButton
                  v-bind="props"
                  icon="dotsHorizontal"
                  aria-label="Mais ações"
                />
              </template>
              <SiList
                density="compact"
                class="si-rowmenu"
              >
                <SiListItem
                  title="Editar dados"
                  @click="emit('edit', item)"
                />
                <SiListItem
                  title="Habilitar seguradora"
                  @click="emit('enable', item)"
                />
                <SiListItem
                  title="Inativar corretora"
                  class="si-rowmenu__danger"
                  @click="emit('inactivate', item)"
                />
              </SiList>
            </SiMenu>
          </div>
        </li>
      </ul>
    </template>

    <SiDataTable
      v-else
      :headers="headers"
      :items="items"
      :loading="loading"
      :items-per-page="-1"
      hide-default-footer
      class="si-brokerage-list__table"
      @click:row="onRowClick"
    >
      <template #[`item.name`]="{ item }">
        <div class="si-brokerage-list__identity">
          <SiAvatar
            size="sm"
            rounded="lg"
          >
            {{ initials(item) }}
          </SiAvatar>
          <div class="si-brokerage-list__identity-text">
            <span class="si-cell-strong">{{ item.socialName || item.name }}</span>
            <span class="si-brokerage-list__meta">{{ formatCnpj(item.documentNumber) }} · {{ item.name }}</span>
          </div>
        </div>
      </template>

      <template #[`item.insurers`]="{ item }">
        <div class="si-brokerage-list__insurers">
          <span class="si-cell-strong">
            {{ item.enabledInsurerCount }} seguradora{{ item.enabledInsurerCount === 1 ? '' : 's' }}
          </span>
          <span class="si-brokerage-list__meta">{{ insurersSummary(item) }}</span>
        </div>
      </template>

      <template #[`item.engine`]="{ item }">
        {{ engineLabel(item) }}
      </template>

      <template #[`item.registeredAt`]="{ item }">
        <span class="si-brokerage-list__nums">{{ formatDate(item.registeredAt) }}</span>
      </template>

      <template #[`item.situation`]="{ item }">
        <SiChip
          :color="getBrokerageSituationView(item.situation).color"
          size="small"
        >
          {{ getBrokerageSituationView(item.situation).label }}
        </SiChip>
      </template>

      <template #[`item.actions`]="{ item }">
        <div
          class="si-brokerage-list__actions"
          @click.stop
        >
          <SiTooltip text="Ver detalhes">
            <template #activator="{ props }">
              <SiIconButton
                v-bind="props"
                icon="eye"
                tone="view"
                aria-label="Ver detalhes"
                @click="emit('view', item)"
              />
            </template>
          </SiTooltip>

          <SiMenu location="bottom end">
            <template #activator="{ props }">
              <SiIconButton
                v-bind="props"
                icon="dotsHorizontal"
                aria-label="Mais ações"
              />
            </template>
            <SiList
              density="compact"
              class="si-rowmenu"
            >
              <SiListItem
                title="Ver detalhes"
                @click="emit('view', item)"
              />
              <SiListItem
                title="Editar dados"
                @click="emit('edit', item)"
              />
              <SiListItem
                title="Habilitar seguradora"
                @click="emit('enable', item)"
              />
              <SiListItem
                title="Inativar corretora"
                class="si-rowmenu__danger"
                @click="emit('inactivate', item)"
              />
            </SiList>
          </SiMenu>
        </div>
      </template>
    </SiDataTable>
  </div>
</template>

<style scoped>
.si-brokerage-list__identity {
  display: flex;
  align-items: center;
  gap: var(--si-space-3);
  min-width: 0;
}

.si-brokerage-list__identity-text,
.si-brokerage-list__insurers {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.si-brokerage-list__meta {
  color: var(--si-cinza);
  font-size: var(--si-fs-caption);
  font-variant-numeric: tabular-nums;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.si-brokerage-list__nums {
  font-variant-numeric: tabular-nums;
  color: var(--si-cinza);
}

.si-brokerage-list__actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--si-space-1);
}

.si-rowmenu__danger :deep(.v-list-item-title) {
  color: rgb(var(--v-theme-error));
}

/* ─── Mobile: cartões ─────────────────────────────────────────────────────── */
.si-brokerage-cards__progress {
  margin-bottom: var(--si-space-2);
}

.si-brokerage-cards {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--si-space-3);
}

.si-brokerage-cards__item {
  border: 1px solid var(--si-cinza-claro);
  border-radius: var(--si-radius-lg);
  padding: var(--si-space-3) var(--si-space-4);
  display: flex;
  flex-direction: column;
  gap: var(--si-space-2);
}

.si-brokerage-cards__main {
  display: flex;
  align-items: center;
  gap: var(--si-space-3);
  width: 100%;
  min-height: 44px;
  padding: 0;
  border: 0;
  background: transparent;
  text-align: start;
  cursor: pointer;
}

.si-brokerage-cards__identity {
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1;
}

.si-brokerage-cards__facts {
  display: flex;
  flex-direction: column;
  gap: 2px;
  color: var(--si-cinza);
  font-size: var(--si-fs-caption);
}

.si-brokerage-cards__actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-top: 1px solid var(--si-cinza-claro);
  padding-top: var(--si-space-2);
}
</style>
