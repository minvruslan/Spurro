<script setup lang="ts">
import ServerList from "./ServerList.vue"
import { useServers } from "../composables/useServers"
import type { ServerListItem } from "../types/ServerListItem"
import { messages } from "../translations/ServerListSelf"

defineEmits<{ (e: "open", server: ServerListItem): void }>()

const { t } = useI18n({ useScope: "local", messages })
const { servers, status, error } = useServers()
</script>

<template>
  <p v-if="error" role="alert" class="text-sm text-muted-foreground">{{ t("loadError") }}</p>

  <ServerList
    v-else
    :servers="servers"
    :pending="status === 'pending'"
    @open="$emit('open', $event)"
  />
</template>
