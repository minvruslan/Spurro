<script setup lang="ts">
import { Badge } from "@/components/ui/badge"

defineProps<{ protocols: string[] }>()
</script>

<template>
  <div v-if="protocols.length" class="flex flex-wrap gap-1.5">
    <Badge v-for="protocol in protocols" :key="protocol" variant="secondary">{{ protocol }}</Badge>
  </div>
  <span v-else class="text-sm text-muted-foreground">—</span>
</template>
