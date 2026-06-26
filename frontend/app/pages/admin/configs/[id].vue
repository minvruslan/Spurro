<script setup lang="ts">
import { UpdateConfigForm } from "@/modules/features/update-config"

definePageMeta({
  middleware: "admin",
  layout: "admin",
  key: (route) => route.params.id as string,
})

const route = useRoute()
const id = route.params.id as string

const goBack = () => navigateTo("/admin/configs")
</script>

<template>
  <UpdateConfigForm :id="id" @updated="goBack" @deleted="goBack" @cancel="goBack" />
</template>
