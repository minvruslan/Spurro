<script setup lang="ts">
import type { Server } from "@spurro/shared"
import { computed } from "vue"
import { ChevronRight } from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import { useCountries } from "@/modules/common/composables"
import ProtocolList from "./ProtocolList.vue"
import ServerStatusText from "./ServerStatusText.vue"
import { getServerStatusStyle } from "../utils/getServerStatusStyle"
import { messages } from "../translations/ServerCard"

const props = defineProps<{ server: Server }>()

defineEmits<{ (e: "open"): void }>()

const { t } = useI18n({ useScope: "local", messages })
const { getCountryName } = useCountries()

const protocols = computed(() => [
  ...new Set(props.server.endpoints.map((endpoint) => endpoint.protocol.type.name)),
])
const countryName = computed(() => getCountryName(props.server.country))
const railClass = computed(() => getServerStatusStyle(props.server.status).rail)
</script>

<template>
  <div class="@container">
    <div class="flex overflow-hidden rounded-xl border bg-card">
      <!-- Status rail -->
      <div :class="['w-1 flex-none', railClass]" aria-hidden="true" />

      <!-- Desktop -->
      <div
        class="hidden flex-1 items-center gap-4.5 px-4.5 py-3.5 @2xl:grid @2xl:grid-cols-[1.4fr_auto_1fr_1.5fr_auto]"
      >
        <div class="min-w-0">
          <p class="truncate text-sm font-semibold tracking-tight">{{ server.name }}</p>
          <p class="mt-1 truncate font-mono text-xs text-muted-foreground">
            {{ server.domainName }}
          </p>
        </div>
        <div class="w-32">
          <span class="sr-only">{{ t("labels.status") }}: </span>
          <ServerStatusText :status="server.status" />
        </div>
        <span class="min-w-0 truncate text-sm">
          <span class="sr-only">{{ t("labels.country") }}: </span>{{ countryName }}
        </span>
        <div class="flex min-w-0 items-center gap-1.5">
          <span class="sr-only">{{ t("labels.protocols") }}: </span>
          <ProtocolList :protocols="protocols" />
        </div>
        <Button
          variant="outline"
          size="sm"
          class="flex-none"
          :aria-label="t('openServerAriaLabel', { name: server.name })"
          @click="$emit('open')"
        >
          {{ t("open") }}
          <ChevronRight class="size-4" aria-hidden="true" />
        </Button>
      </div>

      <!-- Mobile -->
      <div class="relative min-w-0 flex-1 p-4 @2xl:hidden">
        <div class="mb-3 flex items-center justify-between gap-2.5">
          <div class="min-w-0">
            <p class="truncate text-sm font-semibold tracking-tight">{{ server.name }}</p>
            <p class="mt-1 truncate font-mono text-xs text-muted-foreground">
              {{ server.domainName }}
            </p>
          </div>
          <ChevronRight class="size-4.5 flex-none text-muted-foreground" aria-hidden="true" />
        </div>

        <div class="mb-3 h-px bg-border" />

        <div class="flex flex-col gap-2.5 text-sm leading-5">
          <div class="flex min-h-6 items-center justify-between gap-4">
            <span class="flex-none text-muted-foreground">{{ t("labels.status") }}</span>
            <ServerStatusText :status="server.status" />
          </div>
          <div class="flex min-h-6 items-center justify-between gap-4">
            <span class="flex-none text-muted-foreground">{{ t("labels.country") }}</span>
            <span class="min-w-0 truncate">{{ countryName }}</span>
          </div>
          <div class="flex min-h-6 items-center justify-between gap-4">
            <span class="flex-none text-muted-foreground">{{ t("labels.protocols") }}</span>
            <ProtocolList :protocols="protocols" />
          </div>
        </div>

        <button
          type="button"
          class="absolute inset-0 cursor-pointer rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/50"
          :aria-label="t('openServerAriaLabel', { name: server.name })"
          @click="$emit('open')"
        />
      </div>
    </div>
  </div>
</template>
