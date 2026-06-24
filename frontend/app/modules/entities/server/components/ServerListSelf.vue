<script setup lang="ts">
import type { Server } from "@spurro/shared"
import { ListErrorState } from "@/modules/common/components"
import ServerList from "./ServerList.vue"
import { useServers } from "../composables/useServers"
import { messages } from "../translations/ServerListSelf"

defineEmits<{ (e: "open", server: Server): void }>()

const { t } = useI18n({ useScope: "local", messages })
const { servers, status, error } = useServers()
</script>

<template>
  <ListErrorState
    v-if="error"
    :title="t('loadError')"
    mobile-card-height="min-h-35.5"
    desktop-card-height="sm:min-h-17.5"
  />

  <ServerList
    v-else
    :servers="servers"
    :pending="status === 'pending'"
    @open="$emit('open', $event)"
  />
</template>
