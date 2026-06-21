<script setup lang="ts">
import type { Server } from "@spurro/shared"
import { Plus } from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import { ServerListSelf } from "@/modules/entities/server"

definePageMeta({ middleware: "admin", layout: "admin" })

const messages = {
  ru: { title: "Серверы", createServer: "Создать сервер" },
  en: { title: "Servers", createServer: "Create server" },
}

const { t } = useI18n({ useScope: "local", messages })

const onOpen = (server: Server) => navigateTo(`/admin/servers/${server.id}`)
</script>

<template>
  <section class="flex flex-col gap-4.5">
    <div class="flex items-center justify-between gap-2">
      <h1 class="text-2xl font-semibold">{{ t("title") }}</h1>
      <Button as-child class="hidden sm:inline-flex">
        <NuxtLink to="/admin/servers/create">
          <Plus class="size-4" aria-hidden="true" />
          {{ t("createServer") }}
        </NuxtLink>
      </Button>
    </div>

    <Button as-child class="sm:hidden">
      <NuxtLink to="/admin/servers/create">
        <Plus class="size-4" aria-hidden="true" />
        {{ t("createServer") }}
      </NuxtLink>
    </Button>

    <ServerListSelf @open="onOpen" />
  </section>
</template>
