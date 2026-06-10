<script setup lang="ts">
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
</script>

<template>
  <!-- Desktop -->
  <Card class="hidden px-4 py-3.5 sm:block">
    <div class="flex items-center justify-between gap-4">
      <div class="flex min-w-0 flex-1 items-center gap-3.5">
        <Skeleton class="h-4 w-32" />
        <Skeleton class="h-4 w-48" />
      </div>
      <Skeleton class="h-8 w-24 rounded-md" />
    </div>
  </Card>

  <!-- Mobile -->
  <Card class="block p-4 sm:hidden">
    <div class="flex items-center justify-between gap-3">
      <div class="flex flex-col gap-1.5">
        <Skeleton class="h-4 w-28" />
        <Skeleton class="h-3 w-40" />
      </div>
      <Skeleton class="size-5" />
    </div>
  </Card>
</template>
