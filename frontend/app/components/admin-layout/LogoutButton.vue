<script setup lang="ts">
import { LogOut } from "lucide-vue-next"
import { logout } from "@/modules/features/login/services/logout"
import { messages } from "@/translations/admin-layout/LogoutButton"

const { t } = useI18n({ useScope: "local", messages })

const onLogout = () => logout()
</script>

<template>
  <button
    type="button"
    class="flex w-full cursor-pointer items-center gap-3 rounded-md px-2.5 py-2 text-sm font-medium text-muted-foreground outline-none transition-all duration-300 active:scale-[0.98] hover:bg-accent/50 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
    @click="onLogout"
  >
    <LogOut class="size-4 shrink-0" aria-hidden="true" />
    <span>{{ t("logout") }}</span>
  </button>
</template>
