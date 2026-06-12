<script setup lang="ts">
import { computed } from "vue"
import { ChevronRight } from "lucide-vue-next"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { cn } from "@/components/ui/utils/cn"
import type { ServerListItem, ServerStatus } from "../types/ServerListItem"
import { messages } from "../translations/ServerCard"

const props = defineProps<{ server: ServerListItem }>()

defineEmits<{ (e: "open"): void }>()

const { t } = useI18n({ useScope: "local", messages })

// Exhaustively keyed on ServerStatus: adding a status to the union is a compile
// error here until it's given a label.
const STATUS_LABEL_KEY: Record<ServerStatus, string> = {
  active: "statusActive",
  inactive: "statusInactive",
  maintenance: "statusMaintenance",
}

const isOnline = computed(() => props.server.status === "active")
const statusLabel = computed(() => t(STATUS_LABEL_KEY[props.server.status]))
const dotClass = computed(() => (isOnline.value ? "bg-emerald-500" : "bg-muted-foreground/40"))
</script>

<template>
  <!-- Desktop -->
  <Card class="hidden px-4 py-3.5 sm:block">
    <div class="flex items-center justify-between gap-4">
      <div class="flex min-w-0 flex-1 items-center gap-3.5">
        <div class="w-48 shrink-0">
          <div class="truncate text-sm font-semibold">{{ server.name }}</div>
          <div class="mt-1 flex items-center gap-1.5">
            <span :class="cn('size-2 shrink-0 rounded-full', dotClass)" role="img" :aria-label="statusLabel" />
            <span class="truncate font-mono text-xs text-muted-foreground">{{ server.hostname }}</span>
          </div>
        </div>
        <span class="w-28 shrink-0 truncate text-sm text-muted-foreground">{{ server.country }}</span>
        <div class="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
          <Badge v-for="protocol in server.protocols" :key="protocol" variant="secondary">{{ protocol }}</Badge>
        </div>
      </div>
      <Button variant="outline" size="sm" class="shrink-0" @click="$emit('open')">
        {{ t("open") }}
        <ChevronRight class="size-4" aria-hidden="true" />
      </Button>
    </div>
  </Card>

  <!-- Mobile -->
  <Card
    class="block cursor-pointer p-4 outline-none focus-visible:ring-2 focus-visible:ring-ring/50 sm:hidden"
    role="button"
    tabindex="0"
    :aria-label="t('openServerAriaLabel', { name: server.name })"
    @click="$emit('open')"
    @keydown.enter="$emit('open')"
    @keydown.space.prevent="$emit('open')"
  >
    <div class="flex flex-col gap-2.5">
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0">
          <div class="truncate text-sm font-semibold">{{ server.name }}</div>
          <div class="mt-1 flex items-center gap-1.5">
            <span :class="cn('size-2 shrink-0 rounded-full', dotClass)" role="img" :aria-label="statusLabel" />
            <span class="truncate font-mono text-xs text-muted-foreground">{{ server.hostname }}</span>
          </div>
        </div>
        <ChevronRight class="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
      </div>
      <div class="flex items-center justify-between gap-2.5">
        <span class="text-sm text-muted-foreground">{{ server.country }}</span>
        <div class="flex flex-wrap items-center justify-end gap-1.5">
          <Badge v-for="protocol in server.protocols" :key="protocol" variant="secondary">{{ protocol }}</Badge>
        </div>
      </div>
    </div>
  </Card>
</template>
