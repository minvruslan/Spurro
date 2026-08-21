<script setup lang="ts">
import { Card } from "@/components/ui/card"
</script>

<template>
  <Card class="flex h-full min-h-0 flex-col gap-0 overflow-hidden py-0">
    <div class="flex shrink-0 items-center border-b px-6 py-4">
      <slot name="title" />
    </div>

    <div
      class="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-6 py-5 [scrollbar-gutter:stable]"
    >
      <slot name="body" />
    </div>

    <div
      class="flex shrink-0 flex-col-reverse gap-3 border-t px-6 py-4 sm:flex-row sm:items-center sm:justify-end"
    >
      <slot name="actions" />
    </div>
  </Card>
</template>
