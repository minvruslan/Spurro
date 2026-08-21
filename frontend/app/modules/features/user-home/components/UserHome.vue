<script setup lang="ts">
import type { Config } from "@spurro/api-contract"
import ConfigListCard from "./ConfigListCard.vue"
import ConfigLimitsCard from "./ConfigLimitsCard.vue"

defineEmits<{ (e: "open", config: Config): void; (e: "create"): void }>()
</script>

<template>
  <div class="flex min-h-0 flex-1 flex-col gap-4">
    <ConfigLimitsCard />
    <ConfigListCard @open="$emit('open', $event)" @create="$emit('create')" />
  </div>
</template>
