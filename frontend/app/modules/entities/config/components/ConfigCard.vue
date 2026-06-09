<script setup lang="ts">
import type { Config, DeviceType } from "@spurro/shared"
import type { Component } from "vue"
import { computed } from "vue"
import { ChevronRight, Monitor, Smartphone } from "lucide-vue-next"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { messages } from "../translations/ConfigCard"

const props = defineProps<{ config: Config }>()

defineEmits<{ (e: "open"): void }>()

const { t } = useI18n({ useScope: "local", messages })

// Exhaustively keyed on DeviceType["code"]: adding a code to the @spurro/shared enum
// is a compile error here until it's classified.
const DEVICE_ICON: Record<DeviceType["code"], Component> = {
  ios: Smartphone,
  android: Smartphone,
  macos: Monitor,
  windows: Monitor,
  linux: Monitor,
}

const DeviceIcon = computed(() => DEVICE_ICON[props.config.deviceType.code])
const protocolName = computed(() => props.config.endpoint.protocol.type.name)
</script>

<template>
  <!-- Desktop -->
  <Card class="hidden px-4 py-3.5 md:block">
    <div class="flex items-center justify-between gap-4">
      <div class="flex min-w-0 flex-1 items-center gap-3.5">
        <div class="w-48 truncate text-sm font-semibold">{{ config.name }}</div>
        <div class="flex w-28 items-center gap-1.5">
          <component
            :is="DeviceIcon"
            class="size-3.5 shrink-0 text-muted-foreground"
            aria-hidden="true"
          />
          <span class="truncate text-sm text-muted-foreground">{{ config.deviceType.name }}</span>
        </div>
        <Badge variant="secondary">{{ protocolName }}</Badge>
      </div>
      <Button variant="outline" size="sm" @click="$emit('open')">
        {{ t("open") }}
        <ChevronRight class="size-4" aria-hidden="true" />
      </Button>
    </div>
  </Card>

  <!-- Mobile -->
  <Card
    class="block cursor-pointer p-4 outline-none focus-visible:ring-2 focus-visible:ring-ring/50 md:hidden"
    role="button"
    tabindex="0"
    :aria-label="t('openConfigAriaLabel', { name: config.name })"
    @click="$emit('open')"
    @keydown.enter="$emit('open')"
    @keydown.space.prevent="$emit('open')"
  >
    <div class="flex items-center justify-between gap-3">
      <div class="flex min-w-0 flex-col gap-1">
        <div class="truncate text-sm font-semibold">{{ config.name }}</div>
        <div class="flex items-center gap-1.5">
          <component
            :is="DeviceIcon"
            class="size-3 shrink-0 text-muted-foreground"
            aria-hidden="true"
          />
          <span class="truncate text-xs text-muted-foreground">{{ config.deviceType.name }}</span>
        </div>
      </div>
      <div class="flex shrink-0 items-center gap-3">
        <Badge variant="secondary">{{ protocolName }}</Badge>
        <ChevronRight class="size-5 text-muted-foreground" aria-hidden="true" />
      </div>
    </div>
  </Card>
</template>
