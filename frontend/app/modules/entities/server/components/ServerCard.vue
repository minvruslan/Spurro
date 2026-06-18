<script setup lang="ts">
import type { Server } from "@spurro/shared"
import { computed } from "vue"
import { ChevronRight } from "lucide-vue-next"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { messages } from "../translations/ServerCard"

const props = defineProps<{ server: Server }>()

defineEmits<{ (e: "open"): void }>()

const { t } = useI18n({ useScope: "local", messages })

const protocols = computed(() => [
  ...new Set(props.server.endpoints.map((endpoint) => endpoint.protocol.type.name)),
])
</script>

<template>
  <!-- Desktop -->
  <Card class="hidden px-4 py-3.5 sm:block">
    <div class="flex items-center justify-between gap-4">
      <div class="flex min-w-0 flex-1 items-center gap-3.5">
        <div class="w-48 shrink-0">
          <p class="truncate text-sm font-semibold">{{ server.name }}</p>
          <p class="mt-1 truncate font-mono text-xs text-muted-foreground">
            {{ server.domainName }}
          </p>
        </div>
        <div class="w-32 shrink-0 truncate text-sm">{{ server.country }}</div>
        <div class="flex min-w-0 flex-1 flex-wrap gap-1.5">
          <Badge v-for="protocol in protocols" :key="protocol" variant="secondary">
            {{ protocol }}
          </Badge>
        </div>
      </div>
      <Button variant="outline" size="sm" @click="$emit('open')">
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
    <div class="flex items-center justify-between gap-3">
      <div class="flex min-w-0 flex-1 flex-col gap-2.5">
        <p class="truncate text-sm font-semibold">{{ server.name }}</p>
        <span class="truncate font-mono text-xs text-muted-foreground">{{
          server.domainName
        }}</span>
        <span class="text-sm">{{ server.country }}</span>
        <div class="flex flex-wrap gap-1.5">
          <Badge v-for="protocol in protocols" :key="protocol" variant="secondary">
            {{ protocol }}
          </Badge>
        </div>
      </div>
      <ChevronRight class="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
    </div>
  </Card>
</template>
