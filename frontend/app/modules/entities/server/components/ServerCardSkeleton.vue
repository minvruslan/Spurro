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
          <div class="mt-1 flex items-center gap-1.5">
            <Skeleton class="size-2 shrink-0 rounded-full" />
            <Skeleton class="h-3 w-28" />
          </div>
        </div>
        <Skeleton class="h-4 w-20" />
        <div class="flex min-w-0 flex-1 items-center gap-1.5">
          <Skeleton class="h-5 w-16 rounded-md" />
          <Skeleton class="h-5 w-16 rounded-md" />
        </div>
      </div>
      <Skeleton class="h-8 w-24 rounded-md" />
    </div>
  </Card>

  <!-- Mobile -->
  <Card class="block p-4 sm:hidden">
    <div class="flex flex-col gap-2.5">
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0">
          <Skeleton class="h-4 w-28" />
          <div class="mt-1 flex items-center gap-1.5">
            <Skeleton class="size-2 shrink-0 rounded-full" />
            <Skeleton class="h-3 w-24" />
          </div>
        </div>
        <Skeleton class="size-5" />
      </div>
      <div class="flex items-center justify-between gap-2.5">
        <Skeleton class="h-4 w-20" />
        <div class="flex items-center gap-1.5">
          <Skeleton class="h-5 w-16 rounded-md" />
        </div>
      </div>
    </div>
  </Card>
</template>
