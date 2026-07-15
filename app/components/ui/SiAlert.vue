<script setup lang="ts">
/**
 * SiAlert — wrapper de VAlert (ADR-013). `type` (success/info/warning/error) mapeia as
 * cores semânticas da plataforma; variante/raio curados; `title`, `text`, `closable` por $attrs.
 */
defineOptions({ inheritAttrs: false })

withDefaults(defineProps<{
  type?: 'success' | 'info' | 'warning' | 'error'
  variant?: 'flat' | 'tonal' | 'outlined' | 'text' | 'elevated'
  rounded?: boolean | string
  prominent?: boolean
}>(), {
  type: undefined,
  variant: 'tonal',
  rounded: 'md',
})
</script>

<template>
  <VAlert
    v-bind="$attrs"
    :type="type"
    :variant="variant"
    :rounded="rounded"
    :prominent="prominent"
  >
    <template v-for="(_, name) in $slots" #[name]="slotProps">
      <slot :name="name" v-bind="slotProps ?? {}" />
    </template>
  </VAlert>
</template>
