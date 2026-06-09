<script setup lang="ts">
import { Shield, Users, LogOut } from "lucide-vue-next"
import { BrandIcon, BrandIconWithText } from "@/modules/entities/brand"
import { logout } from "@/modules/features/login/services/logout"
import { messages } from "@/translations/AdminTopBar"

const { t } = useI18n({ useScope: "local", messages })

const tabs = [
  { key: "configs", to: "/admin/configs", icon: Shield },
  { key: "users", to: "/admin/users", icon: Users },
]

const route = useRoute()
const isActive = (to: string) => route.path === to || route.path.startsWith(to + "/")

const onLogout = () => logout()
</script>

<template>
  <header class="sticky top-0 z-10 border-b border-border bg-background py-3.5">
    <div class="mx-auto flex w-full max-w-205 items-center justify-between gap-2 px-4 md:px-7">
      <div class="flex items-center gap-3 md:gap-6">
        <BrandIcon class="sm:hidden" />
        <span class="sr-only sm:hidden">Spurro</span>
        <div class="hidden sm:block">
          <BrandIconWithText />
        </div>
        <nav :aria-label="t('navLabel')" class="flex items-center gap-0.5">
          <NuxtLink
            v-for="tab in tabs"
            :key="tab.to"
            :to="tab.to"
            :aria-current="isActive(tab.to) ? 'page' : undefined"
            class="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-2.5 py-1.5 text-sm font-medium outline-none transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50 md:px-3"
            :class="isActive(tab.to) ? 'bg-accent text-foreground' : 'text-muted-foreground'"
          >
            <component :is="tab.icon" class="size-4 shrink-0" aria-hidden="true" />
            {{ t(tab.key) }}
          </NuxtLink>
        </nav>
      </div>

      <Button
        variant="ghost"
        size="icon"
        class="shrink-0"
        :aria-label="t('logout')"
        @click="onLogout"
      >
        <LogOut class="size-4" aria-hidden="true" />
      </Button>
    </div>
  </header>
</template>
