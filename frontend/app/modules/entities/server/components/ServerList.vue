<script setup lang="ts">
import { Server } from "lucide-vue-next"
import { computed } from "vue"
import ListEmptyState from "@/modules/shared/components/ListEmptyState.vue"
import ServerCard from "./ServerCard.vue"
import ServerCardSkeleton from "./ServerCardSkeleton.vue"
import type { ServerListItem } from "../types/ServerListItem"
import { messages } from "../translations/ServerList"

const { t } = useI18n({ useScope: "local", messages })

const props = withDefaults(
  defineProps<{
    servers: ServerListItem[]
    pending?: boolean
    skeletonCount?: number
  }>(),
  { skeletonCount: 1 },
)

defineEmits<{ (e: "open", server: ServerListItem): void }>()

const isEmpty = computed(() => !props.pending && props.servers.length === 0)
</script>

<template>
  <Transition
    mode="out-in"
    enter-active-class="transition-opacity duration-500"
    leave-active-class="transition-opacity duration-500"
    enter-from-class="opacity-0"
    leave-to-class="opacity-0"
  >
    <ListEmptyState
      v-if="isEmpty"
      key="empty"
      :icon="Server"
      :title="t('emptyTitle')"
    />

    <div v-else-if="pending" key="skeleton" class="flex flex-col gap-3">
      <ServerCardSkeleton v-for="i in skeletonCount" :key="i" />
    </div>

    <div v-else key="cards" class="flex flex-col gap-3">
      <ServerCard
        v-for="server in servers"
        :key="server.id"
        :server="server"
        @open="$emit('open', server)"
      />
    </div>
  </Transition>
</template>
