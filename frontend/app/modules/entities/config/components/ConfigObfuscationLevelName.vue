<script setup lang="ts">
import type { ConfigObfuscationLevel } from "../types/ConfigObfuscationLevel"
import { messages } from "../translations/ConfigObfuscationLevelName"

defineProps<{ level: ConfigObfuscationLevel }>()

const { t } = useI18n({ useScope: "local", messages })
</script>

<template>
  <span>{{ t(level) }}</span>
</template>
