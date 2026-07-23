<script setup lang="ts">
/**
 * SiTab — wrapper de VTab (ADR-013). Item de SiTabs. `value`, `prepend-icon` por $attrs.
 * DS (Tabs.jsx): o badge de contagem é OPCIONAL (`t.badge != null`) — passe `count` só quando
 * a aba tiver número; sem `count`, renderiza só o rótulo. Conteúdo custom via slot default.
 */
defineOptions({ inheritAttrs: false })

const props = defineProps<{
  text?: string
  count?: number | string
}>()

const hasCount = computed(() =>
  props.count !== undefined && props.count !== null && props.count !== '',
)
</script>

<template>
  <VTab class="si-tab" v-bind="$attrs">
    <slot>{{ text }}</slot>
    <span
      v-if="hasCount"
      class="si-tab__count"
    >{{ count }}</span>
  </VTab>
</template>
