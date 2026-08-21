<script setup lang="ts">
import type { Config } from "@spurro/api-contract"
import { computed } from "vue"
import { useConfigs } from "@/modules/entities/config"
import { isReachedConfigLimit, useConfigLimits } from "@/modules/entities/config-limit"
import ConfigLimitsCard from "./ConfigLimitsCard.vue"
import ConfigListCard from "./ConfigListCard.vue"

defineEmits<{ (e: "open", config: Config): void; (e: "create"): void }>()

const { configs, status: configsStatus, error: configsError } = useConfigs()
const { configLimits, status: configLimitsStatus, error: configLimitsError } = useConfigLimits()

const configsPending = computed(() => configsStatus.value === "pending")
const configLimitsPending = computed(() => configLimitsStatus.value === "pending")
const limitReached = computed(() => configLimits.value.some(isReachedConfigLimit))
</script>

<template>
  <div class="flex min-h-0 flex-1 flex-col gap-4">
    <ConfigLimitsCard
      :config-limits="configLimits"
      :pending="configLimitsPending"
      :error="!!configLimitsError"
    />
    <ConfigListCard
      :configs="configs"
      :pending="configsPending"
      :error="!!configsError"
      :limit-reached="limitReached"
      @open="$emit('open', $event)"
      @create="$emit('create')"
    />
  </div>
</template>
