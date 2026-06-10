<script setup lang="ts">
import type { LucideIcon } from "lucide-vue-next"
import { Card } from "@/components/ui/card"

defineProps<{
  icon: LucideIcon
  title: string
}>()
</script>

<template>
  <Card class="p-4 sm:px-4 sm:py-3.5">
    <div class="flex min-h-8 items-center gap-3 text-muted-foreground">
      <component :is="icon" class="size-5 shrink-0" aria-hidden="true" />
      <span class="text-sm font-medium">{{ title }}</span>
    </div>
  </Card>
</template>
