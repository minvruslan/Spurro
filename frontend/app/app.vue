<script setup lang="ts">
const { locale, locales } = useI18n()
const lang = computed(
  () => locales.value.find((l) => l.code === locale.value)?.language ?? locale.value,
)
useHead({ htmlAttrs: { lang } })
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
  <ConfirmationDialog />
</template>
