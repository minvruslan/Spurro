<script setup lang="ts">
import type { Server } from "@vancloak/api-contract"
import { ServerList } from "@/modules/features/admin/server-list"

definePageMeta({ middleware: "admin", layout: "admin" })

const onOpen = (server: Server) => navigateTo(`/admin/servers/${server.id}`)
const onCreate = () => navigateTo("/admin/servers/create")
</script>

<template>
  <ServerList @open="onOpen" @create="onCreate" />
</template>
