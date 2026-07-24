<script setup lang="ts">
/**
 * Texto de minuta/cláusula com as tags preenchíveis inline (exec-plan 0015, 4b): o valor
 * preenchido aparece destacado (verde); o que falta aparece como marcador tracejado "[nome]".
 * Cada segmento vira um <span> adjacente — sem espaços extras entre texto e token.
 */
import { parseTemplate, MINUTA_TAG_DEFS } from '~/lib/minuta'

const props = defineProps<{ template: string, values: Record<string, string> }>()

const segments = computed(() => parseTemplate(props.template))

function filled(tag: string): boolean {
  return Boolean(props.values[tag]?.trim())
}

function tokenText(tag: string): string {
  return filled(tag) ? (props.values[tag] as string) : `[${MINUTA_TAG_DEFS[tag]?.inline ?? tag}]`
}
</script>

<template>
  <p class="si-minuta-text"><span
    v-for="(seg, i) in segments"
    :key="i"
    :class="seg.tag ? { 'si-minuta-token': true, 'si-minuta-token--filled': filled(seg.tag) } : null"
  >{{ seg.tag ? tokenText(seg.tag) : seg.text }}</span></p>
</template>

<style scoped>
.si-minuta-text {
  margin: 0;
  font-size: var(--si-fs-small);
  line-height: 1.8;
  color: rgb(var(--v-theme-on-surface));
}

.si-minuta-token {
  font-weight: var(--si-font-weight-semibold);
  border-radius: var(--si-radius-sm);
  padding: 1px 7px;
  color: var(--si-cinza);
  border: 1px dashed var(--si-border-strong);
  white-space: pre-wrap;
}

.si-minuta-token--filled {
  color: rgb(var(--v-theme-primary));
  background: rgba(var(--v-theme-primary), 0.12);
  border-color: transparent;
}
</style>
