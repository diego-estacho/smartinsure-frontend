<script setup lang="ts">
/**
 * SiTooltip — wrapper de VTooltip (ADR-013). `text`, `location` por $attrs.
 * Slots: activator (elemento que dispara), default (conteúdo do tooltip).
 */
defineOptions({ inheritAttrs: false })

withDefaults(defineProps<{
  location?: 'top' | 'bottom' | 'start' | 'end'
}>(), {
  location: 'top',
})
</script>

<template>
  <v-tooltip v-bind="$attrs" :location="location">
    <template v-for="(_, name) in $slots" #[name]="slotProps">
      <slot :name="name" v-bind="slotProps ?? {}" />
    </template>
  </v-tooltip>
</template>
