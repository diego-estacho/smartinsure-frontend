<script setup lang="ts">
definePageMeta({ layout: 'shell' })
</script>

<template>
  <div class="si-ci-page">
    <CreditInquiryPanel mode="page" />
  </div>
</template>

<style scoped>
.si-ci-page {
  padding: 28px 32px 40px;
  background: rgb(var(--v-theme-background));
}

@media (max-width: 1024px) {
  .si-ci-page {
    padding: 20px 16px 28px;
  }
}
</style>
