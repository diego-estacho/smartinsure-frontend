<script setup lang="ts">
/**
 * SiBadge — wrapper de VBadge (ADR-013). Cor curada; `content`, `dot`, `inline`, `location`
 * por $attrs. Slot default = o elemento "badgeado".
 */
defineOptions({ inheritAttrs: false })

withDefaults(defineProps<{
  color?: string
}>(), {
  color: 'error',
})
</script>

<template>
  <VBadge v-bind="$attrs" :color="color">
    <template v-for="(_, name) in $slots" #[name]="slotProps">
      <slot :name="name" v-bind="slotProps ?? {}" />
    </template>
  </VBadge>
</template>
