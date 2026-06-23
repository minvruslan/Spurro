<script setup lang="ts">
import type { HTMLAttributes } from "vue"
import { computed, onMounted, ref } from "vue"
import { Moon, Sun } from "lucide-vue-next"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { messages } from "@/translations/ThemeSwitcher"

const props = defineProps<{ class?: HTMLAttributes["class"] }>()

const { t } = useI18n({ useScope: "local", messages })
const colorMode = useColorMode()

const options = ["light", "dark"] as const

const mounted = ref(false)
onMounted(() => (mounted.value = true))

const current = computed(() => (mounted.value ? colorMode.value : undefined))
const icon = computed(() => (current.value === "dark" ? Moon : Sun))

const onChange = (value: unknown) => {
  if (typeof value === "string" && value) {
    colorMode.preference = value
  }
}
</script>

<template>
  <Select :model-value="current" @update:model-value="onChange">
    <SelectTrigger :class="props.class">
      <span class="sr-only">{{ t("label") }}</span>
      <span class="flex items-center gap-2">
        <component :is="icon" class="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        <SelectValue />
      </span>
    </SelectTrigger>
    <SelectContent>
      <SelectItem v-for="option in options" :key="option" :value="option">
        {{ t(`options.${option}`) }}
      </SelectItem>
    </SelectContent>
  </Select>
</template>
