<script setup lang="ts">
/**
 * Painel de atividade recente (ADR-018) — cada item tem um ícone com tom semântico
 * (success/warning/info/error) via token, título com trecho em destaque, detalhe e hora.
 */
import type { ActivityEntry } from '~/composables/useDashboardMock'

defineProps<{ entries: ActivityEntry[] }>()
</script>

<template>
  <SiCard
    variant="outlined"
    class="si-dash-panel"
  >
    <header class="si-dash-panel__head">
      <h3 class="si-dash-panel__title">
        Atividade recente
      </h3>
      <a
        class="si-dash-activity__all"
        role="button"
        tabindex="0"
      >Ver tudo</a>
    </header>

    <div class="si-dash-panel__body">
      <ul class="si-dash-activity">
        <li
          v-for="entry in entries"
          :key="entry.id"
          class="si-dash-activity__item"
        >
          <span
            class="si-dash-activity__icon"
            :class="`si-dash-activity__icon--${entry.tone}`"
          >
            <SiIcon
              :icon="entry.icon"
              size="small"
            />
          </span>

          <span class="si-dash-activity__text">
            <span class="si-dash-activity__title">
              <b>{{ entry.title }}</b> {{ entry.emphasis }}
            </span>
            <span class="si-dash-activity__detail">{{ entry.detail }}</span>
          </span>

          <span class="si-dash-activity__time">{{ entry.time }}</span>
        </li>
      </ul>
    </div>
  </SiCard>
</template>

<style scoped>
.si-dash-panel__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--si-space-3);
  padding: var(--si-space-4) var(--si-space-5);
  border-bottom: 1px solid var(--si-cinza-claro);
}

.si-dash-panel__title {
  margin: 0;
  font-size: var(--si-fs-h4);
  font-weight: var(--si-font-weight-semibold);
}

.si-dash-panel__body {
  padding: var(--si-space-2) var(--si-space-5) var(--si-space-4);
}

.si-dash-activity__all {
  font-size: var(--si-fs-caption);
  font-weight: var(--si-font-weight-semibold);
  color: rgb(var(--v-theme-primary));
  cursor: pointer;
  text-decoration: none;
}

.si-dash-activity__all:hover {
  text-decoration: underline;
}

.si-dash-activity {
  list-style: none;
  margin: 0;
  padding: 0;
}

.si-dash-activity__item {
  display: grid;
  grid-template-columns: var(--si-space-8) 1fr auto;
  gap: var(--si-space-3);
  align-items: center;
  padding: var(--si-space-3) 0;
  border-bottom: 1px solid var(--si-cinza-claro);
}

.si-dash-activity__item:last-child {
  border-bottom: 0;
}

.si-dash-activity__icon {
  width: var(--si-space-8);
  height: var(--si-space-8);
  border-radius: var(--si-radius-pill);
  display: flex;
  align-items: center;
  justify-content: center;
}

.si-dash-activity__icon--success {
  background: rgba(var(--v-theme-success), 0.14);
  color: rgb(var(--v-theme-success));
}

.si-dash-activity__icon--warning {
  background: rgba(var(--v-theme-warning), 0.16);
  color: rgb(var(--v-theme-warning));
}

.si-dash-activity__icon--info {
  background: rgba(var(--v-theme-info), 0.14);
  color: rgb(var(--v-theme-info));
}

.si-dash-activity__icon--error {
  background: rgba(var(--v-theme-error), 0.12);
  color: rgb(var(--v-theme-error));
}

.si-dash-activity__text {
  display: flex;
  flex-direction: column;
  gap: var(--si-space-1);
  min-width: 0;
}

.si-dash-activity__title {
  font-size: var(--si-fs-small);
}

.si-dash-activity__detail {
  font-size: var(--si-fs-caption);
  color: rgba(var(--v-theme-on-surface), 0.6);
}

.si-dash-activity__time {
  font-size: var(--si-fs-caption);
  color: rgba(var(--v-theme-on-surface), 0.6);
  white-space: nowrap;
}
</style>
