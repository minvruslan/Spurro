<script setup lang="ts">
import { CreateServerForm } from "@/modules/features/admin/create-server"

definePageMeta({ middleware: "admin", layout: "admin" })

const goBack = () => navigateTo("/admin/servers")
</script>

<template>
  <CreateServerForm @created="goBack" @cancel="goBack" />
</template>
