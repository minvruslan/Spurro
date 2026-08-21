<script setup lang="ts">
import { computed, onMounted, ref } from "vue"
import { EllipsisVertical, Globe, LogOut, Moon, Sun } from "@lucide/vue"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { logout } from "@/modules/features/login/services/logout"
import { messages } from "@/translations/user-layout/UserMenu"

type LocaleCode = "ru" | "en"

const { t } = useI18n({ useScope: "local", messages })
const { locale, locales, setLocale } = useI18n()
const colorMode = useColorMode()

const themeOptions = ["light", "dark"] as const

const mounted = ref(false)
onMounted(() => (mounted.value = true))

const currentTheme = computed(() => (mounted.value ? colorMode.value : undefined))
const ThemeIcon = computed(() => (currentTheme.value === "dark" ? Moon : Sun))
const themeLabel = computed(() => (currentTheme.value ? t(`theme.${currentTheme.value}`) : ""))
const localeName = computed(
  () => locales.value.find((entry) => entry.code === locale.value)?.name ?? locale.value,
)

const onSelectLocale = (code: string) => {
  if (code !== locale.value) setLocale(code as LocaleCode)
}

const onSelectTheme = (option: (typeof themeOptions)[number]) => {
  colorMode.preference = option
}

const onLogout = () => logout()
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button type="button" variant="ghost" size="icon" class="size-8" :aria-label="t('menuLabel')">
        <EllipsisVertical class="size-4" aria-hidden="true" />
      </Button>
    </DropdownMenuTrigger>

    <DropdownMenuContent align="end" class="w-54">
      <DropdownMenuSub>
        <DropdownMenuSubTrigger>
          <span class="flex flex-1 items-center justify-between gap-3">
            <span class="flex items-center gap-2">
              <Globe class="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              {{ t("languageLabel") }}
            </span>
            <span class="text-muted-foreground">{{ localeName }}</span>
          </span>
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent>
          <DropdownMenuItem
            v-for="entry in locales"
            :key="entry.code"
            @select="onSelectLocale(entry.code)"
          >
            {{ entry.name }}
          </DropdownMenuItem>
        </DropdownMenuSubContent>
      </DropdownMenuSub>

      <DropdownMenuSub>
        <DropdownMenuSubTrigger>
          <span class="flex flex-1 items-center justify-between gap-3">
            <span class="flex items-center gap-2">
              <component
                :is="ThemeIcon"
                class="size-4 shrink-0 text-muted-foreground"
                aria-hidden="true"
              />
              {{ t("themeLabel") }}
            </span>
            <span class="text-muted-foreground">{{ themeLabel }}</span>
          </span>
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent>
          <DropdownMenuItem
            v-for="option in themeOptions"
            :key="option"
            @select="onSelectTheme(option)"
          >
            {{ t(`theme.${option}`) }}
          </DropdownMenuItem>
        </DropdownMenuSubContent>
      </DropdownMenuSub>

      <DropdownMenuSeparator />

      <DropdownMenuItem @select="onLogout">
        <LogOut class="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        {{ t("logout") }}
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
