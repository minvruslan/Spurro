<script setup lang="ts">
import { ref } from "vue"
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
import { useCountries } from "@/modules/shared/composables"

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

defineProps<{ id?: string; required?: boolean }>()

const model = defineModel<string>({ default: "" })
const open = ref(false)

const { t } = useI18n({ useScope: "local", messages })
const { options, getCountryName } = useCountries()
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
        {{ model ? getCountryName(model) : t("placeholder") }}
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
              :key="c.code"
              :value="c.name"
              @select="
                () => {
                  model = c.code
                  open = false
                }
              "
            >
              <Check
                :class="cn('mr-2 size-4', model === c.code ? 'opacity-100' : 'opacity-0')"
                aria-hidden="true"
              />
              {{ c.name }}
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </PopoverContent>
  </Popover>
</template>
