<script setup lang="ts">
import { Skeleton } from "@/components/ui/skeleton"
</script>

<template>
  <div class="flex w-full shrink-0 items-center gap-3 rounded-lg border p-4">
    <span class="flex min-w-0 flex-1 flex-col gap-1.5">
      <Skeleton class="h-4 w-32" />
      <Skeleton class="h-3 w-44" />
    </span>
    <Skeleton class="h-6 w-24 rounded-full" />
  </div>
</template>
