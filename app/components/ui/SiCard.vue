<script setup lang="ts">
/**
 * SiCard — wrapper de VCard (ADR-013). Elevação/raio/variante curados; `title`, `subtitle`,
 * `to`, etc. por $attrs. Slots livres (default, title, actions, prepend…).
 */
defineOptions({ inheritAttrs: false })

withDefaults(defineProps<{
  variant?: 'elevated' | 'flat' | 'tonal' | 'outlined' | 'text'
  elevation?: number | string
  rounded?: boolean | string
  color?: string
}>(), {
  variant: 'elevated',
  elevation: 1,
  rounded: 'lg',
  color: undefined,
})
</script>

<template>
  <VCard
    class="si-card"
    v-bind="$attrs"
    :variant="variant"
    :elevation="elevation"
    :rounded="rounded"
    :color="color"
  >
    <template v-for="(_, name) in $slots" #[name]="slotProps">
      <slot :name="name" v-bind="slotProps ?? {}" />
    </template>
  </VCard>
</template>
