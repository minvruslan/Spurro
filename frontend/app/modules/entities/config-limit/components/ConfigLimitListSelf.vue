<script setup lang="ts">
import ConfigLimitList from "./ConfigLimitList.vue"
import { useConfigLimits } from "../composables/useConfigLimits"
import { messages } from "../translations/ConfigLimitListSelf"

defineProps<{
  withLimit?: boolean
}>()

const { t } = useI18n({ useScope: "local", messages })
const { configLimits, status, error } = useConfigLimits()
</script>

<template>
  <p v-if="error" role="alert" class="text-sm text-muted-foreground">{{ t("loadError") }}</p>

  <ConfigLimitList
    v-else
    :config-limits="configLimits"
    :pending="status === 'pending'"
    :with-limit="withLimit"
  />
</template>
