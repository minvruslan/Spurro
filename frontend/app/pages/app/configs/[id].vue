<script setup lang="ts">
import { UpdateConfigForm } from "@/modules/features/user/update-config"

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
  <UpdateConfigForm :id="id" @updated="goBack" @deleted="goBack" @cancel="goBack" />
</template>
