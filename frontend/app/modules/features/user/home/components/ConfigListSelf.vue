<script setup lang="ts">
import type { Config } from "@spurro/api-contract"
import { computed } from "vue"
import { useConfigs } from "@/modules/entities/config"
import ConfigList from "./ConfigList.vue"
import { messages } from "../translations/ConfigListSelf"

defineEmits<{ (e: "open", config: Config): void }>()

const { t } = useI18n({ useScope: "local", messages })
const { configs, status, error } = useConfigs()

const pending = computed(() => status.value === "pending")
</script>

<template>
  <p v-if="error" role="alert" class="mt-3 text-sm text-muted-foreground">
    {{ t("loadError") }}
  </p>

  <ConfigList v-else :configs="configs" :pending="pending" @open="$emit('open', $event)" />
</template>
