<script setup lang="ts">
import type { Server } from "@spurro/shared"
import { ServerList } from "@/modules/features/server-list"

definePageMeta({ middleware: "admin", layout: "admin" })

const onOpen = (server: Server) => navigateTo(`/admin/servers/${server.id}`)
const onCreate = () => navigateTo("/admin/servers/create")
</script>

<template>
  <ServerList @open="onOpen" @create="onCreate" />
</template>
