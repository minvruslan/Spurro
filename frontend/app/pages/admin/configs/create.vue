<script setup lang="ts">
import { CreateConfigForm } from "@/modules/features/create-config"

definePageMeta({ middleware: "admin", layout: "admin" })

const goBack = () => navigateTo("/admin/configs")
</script>

<template>
  <CreateConfigForm @created="goBack" @cancel="goBack" />
</template>
