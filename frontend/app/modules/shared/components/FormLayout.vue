<script setup lang="ts">
import { Card } from "@/components/ui/card"

defineEmits<{ (e: "submit"): void }>()
</script>

<template>
  <Card class="flex h-full min-h-0 flex-col gap-0 overflow-hidden py-0">
    <div class="flex shrink-0 items-center border-b px-6 py-4">
      <slot name="title" />
    </div>

    <form class="flex min-h-0 flex-1 flex-col" @submit.prevent="$emit('submit')">
      <div class="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-6 py-5">
        <slot name="body" />
      </div>

      <div class="flex shrink-0 items-center justify-end gap-3 border-t px-6 py-4">
        <slot name="action" />
      </div>
    </form>
  </Card>
</template>
