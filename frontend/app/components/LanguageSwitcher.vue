<script setup lang="ts">
import type { HTMLAttributes } from "vue"
import { Globe } from "lucide-vue-next"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { messages } from "@/translations/LanguageSwitcher"

type LocaleCode = "ru" | "en"

const props = defineProps<{ class?: HTMLAttributes["class"] }>()

const { t } = useI18n({ useScope: "local", messages })
const { locale, locales, setLocale } = useI18n()

const onChange = (value: unknown) => {
  if (typeof value === "string" && value && value !== locale.value) {
    setLocale(value as LocaleCode)
  }
}
</script>

<template>
  <Select :model-value="locale" @update:model-value="onChange">
    <SelectTrigger :class="props.class">
      <span class="sr-only">{{ t("languageLabel") }}</span>
      <span class="flex items-center gap-2">
        <Globe class="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        <SelectValue />
      </span>
    </SelectTrigger>
    <SelectContent>
      <SelectItem v-for="l in locales" :key="l.code" :value="l.code">
        {{ l.name }}
      </SelectItem>
    </SelectContent>
  </Select>
</template>
