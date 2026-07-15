<script setup lang="ts">
/**
 * SiListItem — wrapper de VListItem (ADR-013). Item de SiList. `title`, `subtitle`, `to`,
 * `value`, `prepend-icon` por $attrs. Slots livres.
 */
defineOptions({ inheritAttrs: false })

withDefaults(defineProps<{
  color?: string
  rounded?: boolean | string
}>(), {
  color: 'primary',
  rounded: undefined,
})
</script>

<template>
  <VListItem v-bind="$attrs" :color="color" :rounded="rounded">
    <template v-for="(_, name) in $slots" #[name]="slotProps">
      <slot :name="name" v-bind="slotProps ?? {}" />
    </template>
  </VListItem>
</template>
