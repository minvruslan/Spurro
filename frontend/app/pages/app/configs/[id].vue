<script setup lang="ts">
import { ConfigDetails } from "@/modules/features/config-details"

definePageMeta({
  middleware: "user",
  layout: "user",
  pageTransition: { name: "page", mode: "out-in" },
  key: (route) => route.params.id as string,
})

const route = useRoute()
const id = route.params.id as string

const goBack = () => navigateTo("/app")
</script>

<template>
  <ConfigDetails :id="id" @updated="goBack" @deleted="goBack" @cancel="goBack" />
</template>
