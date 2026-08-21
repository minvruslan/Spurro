<script setup lang="ts">
import { CreateConfigWizard } from "@/modules/features/create-config-wizard"

definePageMeta({
  middleware: "user",
  layout: "user",
  pageTransition: { name: "page", mode: "out-in" },
})

const onExit = () => navigateTo("/app")
const onDone = () => navigateTo("/app", { replace: true })
</script>

<template>
  <CreateConfigWizard @exit="onExit" @done="onDone" />
</template>
