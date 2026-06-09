<script setup lang="ts">
import type { ConfigLimit } from "@spurro/shared"
import { computed } from "vue"
import { Badge } from "@/components/ui/badge"

const props = defineProps<{
  protocolType: ConfigLimit["protocolType"]
  used: number
  max?: number
  withLimit?: boolean
}>()

const isFull = computed(() => props.withLimit && props.used >= (props.max ?? 0))
const fillPercent = computed(() =>
  props.withLimit ? Math.min(100, Math.max(0, (props.used / (props.max ?? 0)) * 100)) : 0,
)
</script>

<template>
  <div class="min-w-50 flex-1 rounded-lg border border-border bg-card p-4">
    <div class="flex flex-col gap-2.5">
      <div class="flex items-center justify-between">
        <Badge variant="outline">{{ protocolType.name }}</Badge>
        <span class="font-mono text-xs text-muted-foreground">
          {{ withLimit ? `${used}/${max}` : used }}
        </span>
      </div>

      <div
        v-if="withLimit"
        aria-hidden="true"
        class="h-2 w-full overflow-hidden rounded-full bg-secondary"
      >
        <div
          class="h-full rounded-full transition-[width] duration-300"
          :class="isFull ? 'bg-zinc-400' : 'bg-primary'"
          :style="{ width: `${fillPercent}%` }"
        />
      </div>
    </div>
  </div>
</template>
