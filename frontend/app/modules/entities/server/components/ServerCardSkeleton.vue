<script setup lang="ts">
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
</script>

<template>
  <!-- Desktop -->
  <Card class="hidden px-4 py-3.5 sm:block">
    <div class="flex items-center justify-between gap-4">
      <div class="flex min-w-0 flex-1 items-center gap-3.5">
        <div class="w-48 shrink-0">
          <Skeleton class="h-5 w-32" />
          <Skeleton class="mt-1 h-4 w-28" />
        </div>
        <div class="w-32 shrink-0">
          <Skeleton class="h-5 w-20" />
        </div>
        <div class="flex min-w-0 flex-1 flex-wrap gap-1.5">
          <Skeleton class="h-5.5 w-16 rounded-full" />
          <Skeleton class="h-5.5 w-16 rounded-full" />
        </div>
      </div>
      <Skeleton class="h-8 w-24 rounded-md" />
    </div>
  </Card>

  <!-- Mobile -->
  <Card class="block p-4 sm:hidden">
    <div class="flex items-center justify-between gap-3">
      <div class="flex min-w-0 flex-1 flex-col gap-2.5">
        <Skeleton class="h-5 w-32" />
        <Skeleton class="h-4 w-28" />
        <Skeleton class="h-5 w-20" />
        <div class="flex flex-wrap gap-1.5">
          <Skeleton class="h-5.5 w-16 rounded-full" />
          <Skeleton class="h-5.5 w-16 rounded-full" />
        </div>
      </div>
      <Skeleton class="size-5 shrink-0" />
    </div>
  </Card>
</template>
