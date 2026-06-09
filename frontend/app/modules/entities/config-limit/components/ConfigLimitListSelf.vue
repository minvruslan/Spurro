<script setup lang="ts">
import ConfigLimitList from "./ConfigLimitList.vue"
import { useConfigLimits } from "../composables/useConfigLimits"

defineProps<{
  withLimit?: boolean
}>()

const { configLimits, status, error } = useConfigLimits()
</script>

<template>
  <p v-if="error" class="text-sm text-muted-foreground">Не удалось загрузить конфигурации</p>

  <ConfigLimitList
    v-else
    :config-limits="configLimits"
    :pending="status === 'pending'"
    :with-limit="withLimit"
  />
</template>
