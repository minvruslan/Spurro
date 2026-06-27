<script setup lang="ts">
import { Skeleton } from "@/components/ui/skeleton"
</script>

<template>
  <div class="@container">
    <div class="flex overflow-hidden rounded-xl border bg-card">
      <!-- Status rail -->
      <div class="w-1 flex-none bg-muted" aria-hidden="true" />

      <!-- Desktop -->
      <div
        class="hidden flex-1 items-center gap-4.5 px-4.5 py-3.5 @2xl:grid @2xl:grid-cols-[1.4fr_auto_1fr_1.5fr_auto]"
      >
        <div class="min-w-0">
          <Skeleton class="h-5 w-32" />
          <Skeleton class="mt-1 h-4 w-24" />
        </div>
        <div class="w-32">
          <Skeleton class="h-5 w-24 rounded-full" />
        </div>
        <Skeleton class="h-5 w-20" />
        <div class="flex min-w-0 items-center gap-1.5">
          <Skeleton class="h-5.5 w-16 rounded-full" />
          <Skeleton class="h-5.5 w-16 rounded-full" />
        </div>
        <Skeleton class="h-8 w-24 rounded-md" />
      </div>

      <!-- Mobile -->
      <div class="min-w-0 flex-1 p-4 @2xl:hidden">
        <div class="mb-3 flex items-center justify-between gap-2.5">
          <div class="min-w-0">
            <Skeleton class="h-5 w-32" />
            <Skeleton class="mt-1 h-4 w-24" />
          </div>
          <Skeleton class="size-4.5 flex-none" />
        </div>

        <div class="mb-3 h-px bg-border" />

        <div class="flex flex-col gap-2.5">
          <div class="flex min-h-6 items-center justify-between gap-4">
            <Skeleton class="h-4 w-16" />
            <Skeleton class="h-5 w-24 rounded-full" />
          </div>
          <div class="flex min-h-6 items-center justify-between gap-4">
            <Skeleton class="h-4 w-16" />
            <Skeleton class="h-5 w-20" />
          </div>
          <div class="flex min-h-6 items-center justify-between gap-4">
            <Skeleton class="h-4 w-20" />
            <div class="flex items-center gap-1.5">
              <Skeleton class="h-5.5 w-16 rounded-full" />
              <Skeleton class="h-5.5 w-16 rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
