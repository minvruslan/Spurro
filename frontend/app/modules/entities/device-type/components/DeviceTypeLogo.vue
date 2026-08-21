<script setup lang="ts">
import type { DeviceType } from "@spurro/api-contract"
import { computed } from "vue"
import { siAndroid, siApple } from "simple-icons"

const props = defineProps<{ code: DeviceType["code"] }>()

const WindowsLogoPath =
  "M3 3h8.5v8.5H3V3zm9.5 0H21v8.5h-8.5V3zM3 12.5h8.5V21H3v-8.5zm9.5 0H21V21h-8.5v-8.5z"
const WindowsLogoColor = "#0078D4"

type DeviceTypeLogoDefinition = { path: string; fill?: string }

const DeviceTypeLogos: Record<DeviceType["code"], DeviceTypeLogoDefinition> = {
  ios: { path: siApple.path },
  ipados: { path: siApple.path },
  macos: { path: siApple.path },
  windows: { path: WindowsLogoPath, fill: WindowsLogoColor },
  android: { path: siAndroid.path, fill: `#${siAndroid.hex}` },
}

const logo = computed(() => DeviceTypeLogos[props.code])
</script>

<template>
  <svg viewBox="0 0 24 24" :fill="logo.fill ?? 'currentColor'" aria-hidden="true">
    <path :d="logo.path" />
  </svg>
</template>
