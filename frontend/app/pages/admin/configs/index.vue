<script setup lang="ts">
import type { Config } from "@spurro/shared"
import { ConfigList } from "@/modules/features/config-list"

definePageMeta({ middleware: "admin", layout: "admin" })

const onOpen = (config: Config) => navigateTo(`/admin/configs/${config.id}`)
const onCreate = () => navigateTo("/admin/configs/create")
</script>

<template>
  <ConfigList @open="onOpen" @create="onCreate" />
</template>
