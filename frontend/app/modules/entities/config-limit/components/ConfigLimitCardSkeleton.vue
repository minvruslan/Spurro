<script setup lang="ts">
import { Skeleton } from "@/components/ui/skeleton"

defineProps<{
  withLimit?: boolean
}>()
</script>

<template>
  <div class="min-w-50 flex-1 rounded-lg border border-border bg-card p-4">
    <div class="flex flex-col gap-2.5">
      <div class="flex items-center justify-between">
        <Skeleton class="h-5 w-16 rounded-full" />
        <Skeleton class="h-4 w-8" />
      </div>

      <Skeleton v-if="withLimit" class="h-2 w-full rounded-full" />
    </div>
  </div>
</template>
