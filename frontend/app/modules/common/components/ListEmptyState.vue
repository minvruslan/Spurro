<script setup lang="ts">
import type { LucideIcon } from "lucide-vue-next"
import { Card } from "@/components/ui/card"

withDefaults(
  defineProps<{
    icon: LucideIcon
    title: string
    mobileCardHeight?: string
    desktopCardHeight?: string
  }>(),
  { mobileCardHeight: "", desktopCardHeight: "" },
)
</script>

<template>
  <Card :class="['flex justify-center p-4 sm:px-4 sm:py-3.5', mobileCardHeight, desktopCardHeight]">
    <div class="flex min-h-8 items-center gap-3 text-muted-foreground">
      <component :is="icon" class="size-5 shrink-0" aria-hidden="true" />
      <span class="text-sm font-medium">{{ title }}</span>
    </div>
  </Card>
</template>
