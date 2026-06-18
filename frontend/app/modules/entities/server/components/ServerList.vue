<script setup lang="ts">
import type { Server } from "@spurro/shared"
import { Server as ServerIcon } from "lucide-vue-next"
import { computed } from "vue"
import { ListEmptyState } from "@/modules/shared/components"
import ServerCard from "./ServerCard.vue"
import ServerCardSkeleton from "./ServerCardSkeleton.vue"
import { messages } from "../translations/ServerList"

const { t } = useI18n({ useScope: "local", messages })

const props = withDefaults(
  defineProps<{
    servers: Server[]
    pending?: boolean
    skeletonCount?: number
  }>(),
  { skeletonCount: 1 },
)

defineEmits<{ (e: "open", server: Server): void }>()

const isEmpty = computed(() => !props.pending && props.servers.length === 0)
</script>

<template>
  <ListEmptyState
    v-if="isEmpty"
    :icon="ServerIcon"
    :title="t('emptyTitle')"
    mobile-card-height="min-h-35.5"
    desktop-card-height="sm:min-h-17.5"
  />

  <div v-else-if="pending" class="flex flex-col gap-3">
    <ServerCardSkeleton v-for="i in skeletonCount" :key="i" />
  </div>

  <div v-else class="flex flex-col gap-3">
    <ServerCard
      v-for="server in servers"
      :key="server.id"
      :server="server"
      @open="$emit('open', server)"
    />
  </div>
</template>
