<script setup lang="ts">
import { computed, ref } from "vue"
import countries from "i18n-iso-countries"
import enLocale from "i18n-iso-countries/langs/en.json"
import ruLocale from "i18n-iso-countries/langs/ru.json"
import { Check, ChevronsUpDown } from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/components/ui/utils/cn"

const messages = {
  ru: {
    placeholder: "Начните вводить страну…",
    search: "Поиск страны…",
    empty: "Страна не найдена.",
  },
  en: {
    placeholder: "Start typing a country…",
    search: "Search country…",
    empty: "No country found.",
  },
}

countries.registerLocale(enLocale)
countries.registerLocale(ruLocale)

defineProps<{ id?: string; required?: boolean }>()

const model = defineModel<string>({ default: "" })
const open = ref(false)

const { t, locale } = useI18n({ useScope: "local", messages })

const options = computed(() => {
  const lang = locale.value === "ru" ? "ru" : "en"
  return Object.values(countries.getNames(lang, { select: "official" })).sort((a, b) =>
    a.localeCompare(b),
  )
})
</script>

<template>
  <Popover v-model:open="open">
    <PopoverTrigger as-child>
      <Button
        :id="id"
        variant="outline"
        role="combobox"
        :aria-expanded="open"
        :aria-required="required || undefined"
        class="w-full justify-between border-input bg-transparent font-normal hover:bg-transparent dark:bg-input/30 dark:hover:bg-input/30"
        :class="!model && 'text-muted-foreground'"
      >
        {{ model || t("placeholder") }}
        <ChevronsUpDown class="ml-2 size-4 shrink-0 opacity-50" aria-hidden="true" />
      </Button>
    </PopoverTrigger>
    <PopoverContent class="w-[--reka-popover-trigger-width] p-0" align="start">
      <Command>
        <CommandInput :placeholder="t('search')" />
        <CommandEmpty>{{ t("empty") }}</CommandEmpty>
        <CommandList>
          <CommandGroup>
            <CommandItem
              v-for="c in options"
              :key="c"
              :value="c"
              @select="
                () => {
                  model = c
                  open = false
                }
              "
            >
              <Check
                :class="cn('mr-2 size-4', model === c ? 'opacity-100' : 'opacity-0')"
                aria-hidden="true"
              />
              {{ c }}
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </PopoverContent>
  </Popover>
</template>
