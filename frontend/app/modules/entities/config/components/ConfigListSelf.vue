<script setup lang="ts">
import type { Config } from "@spurro/shared"
import { ListErrorState } from "@/modules/common/components"
import ConfigList from "./ConfigList.vue"
import { useConfigs } from "../composables/useConfigs"
import { messages } from "../translations/ConfigListSelf"

defineEmits<{ (e: "open", config: Config): void }>()

const { t } = useI18n({ useScope: "local", messages })
const { configs, status, error } = useConfigs()
</script>

<template>
  <ListErrorState v-if="error" :title="t('loadError')" />

  <ConfigList
    v-else
    :configs="configs"
    :pending="status === 'pending'"
    @open="$emit('open', $event)"
  />
</template>
