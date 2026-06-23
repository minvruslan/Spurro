<script setup lang="ts">
import { UpdateServerForm } from "@/modules/features/update-server"

definePageMeta({
  middleware: "admin",
  layout: "admin",
  key: (route) => route.params.id as string,
})

const route = useRoute()
const id = route.params.id as string

const goBack = () => navigateTo("/admin/servers")
</script>

<template>
  <UpdateServerForm :id="id" @updated="goBack" @cancel="goBack" />
</template>
