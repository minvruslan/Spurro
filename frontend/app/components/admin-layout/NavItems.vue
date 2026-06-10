<script setup lang="ts">
import { Shield, Users } from "lucide-vue-next"
import { cn } from "@/components/ui/utils/cn"
import { messages } from "@/translations/admin-layout/NavItems"

const { t } = useI18n({ useScope: "local", messages })

defineEmits<{ (e: "navigate"): void }>()

const navItems = [
  { id: "configs", labelKey: "configs", to: "/admin/configs", icon: Shield },
  { id: "users", labelKey: "users", to: "/admin/users", icon: Users },
]

const route = useRoute()
const isActive = (to: string) => route.path === to || route.path.startsWith(to + "/")
</script>

<template>
  <nav :aria-label="t('navLabel')" class="flex flex-col gap-1">
    <NuxtLink
      v-for="item in navItems"
      :key="item.id"
      :to="item.to"
      :aria-current="isActive(item.to) ? 'page' : undefined"
      :class="
        cn(
          'flex items-center gap-3 rounded-md px-2.5 py-2 text-sm font-medium outline-none transition-all duration-300 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-ring/50',
          isActive(item.to)
            ? 'bg-accent text-accent-foreground'
            : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground',
        )
      "
      @click="$emit('navigate')"
    >
      <component :is="item.icon" class="size-4 shrink-0" aria-hidden="true" />
      <span>{{ t(item.labelKey) }}</span>
    </NuxtLink>
  </nav>
</template>
