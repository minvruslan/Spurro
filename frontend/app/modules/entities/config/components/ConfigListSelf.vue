<script setup lang="ts">
import type { Config } from "@spurro/shared"
import ConfigList from "./ConfigList.vue"
import { useConfigs } from "../composables/useConfigs"
import { messages } from "../translations/ConfigListSelf"

defineEmits<{ (e: "open", config: Config): void }>()

const { t } = useI18n({ useScope: "local", messages })
const { configs, status, error } = useConfigs()
</script>

<template>
  <p v-if="error" role="alert" class="text-sm text-muted-foreground">{{ t("loadError") }}</p>

  <ConfigList
    v-else
    :configs="configs"
    :pending="status === 'pending'"
    @open="$emit('open', $event)"
  />
</template>
