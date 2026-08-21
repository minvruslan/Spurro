<script setup lang="ts">
import { ref } from "vue"
import type { CreatedConfig } from "@/modules/entities/config"
import { ConfigCreatedView, CreateConfigForm } from "@/modules/features/admin/create-config"

definePageMeta({ middleware: "admin", layout: "admin" })

const createdConfig = ref<CreatedConfig | null>(null)

const goBack = () => navigateTo("/admin/configs")
</script>

<template>
  <ConfigCreatedView v-if="createdConfig" :config="createdConfig" @done="goBack" />
  <CreateConfigForm v-else @created="createdConfig = $event" @cancel="goBack" />
</template>
