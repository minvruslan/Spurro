<script setup lang="ts">
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
</script>

<template>
  <!-- Desktop -->
  <Card class="hidden px-4 py-3.5 sm:block">
    <div class="flex items-center justify-between gap-4">
      <div class="flex min-w-0 flex-1 items-center gap-3.5">
        <div class="w-48">
          <Skeleton class="h-4 w-32" />
        </div>
        <div class="flex w-28 items-center gap-1.5">
          <Skeleton class="size-3.5 shrink-0 rounded-sm" />
          <Skeleton class="h-4 w-16" />
        </div>
        <Skeleton class="h-5 w-16 rounded-md" />
      </div>
      <Skeleton class="h-8 w-24 rounded-md" />
    </div>
  </Card>

  <!-- Mobile -->
  <Card class="block p-4 sm:hidden">
    <div class="flex items-center justify-between gap-3">
      <div class="flex min-w-0 flex-col gap-1">
        <Skeleton class="h-4 w-28" />
        <div class="flex min-w-0 items-center gap-1.5">
          <Skeleton class="size-3 shrink-0 rounded-sm" />
          <Skeleton class="h-3 w-20" />
        </div>
      </div>
      <div class="flex shrink-0 items-center gap-3">
        <Skeleton class="h-5 w-16 rounded-md" />
        <Skeleton class="size-5" />
      </div>
    </div>
  </Card>
</template>
