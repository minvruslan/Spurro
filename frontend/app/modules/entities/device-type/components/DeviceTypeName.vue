<script setup lang="ts">
import type { DeviceType } from "@spurro/api-contract"
import { messages } from "../translations/DeviceTypeName"

defineProps<{ code: DeviceType["code"] }>()

const { t } = useI18n({ useScope: "local", messages })
</script>

<template>
  <span>{{ t(code) }}</span>
</template>
