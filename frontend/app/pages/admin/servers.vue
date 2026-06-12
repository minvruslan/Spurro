<script setup lang="ts">
import type { ServerListItem } from "@/modules/entities/server"
import { Plus } from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import { ServerListSelf } from "@/modules/entities/server"

definePageMeta({ middleware: "admin", layout: "admin" })

const messages = {
  ru: { title: "Серверы", addServer: "Добавить сервер" },
  en: { title: "Servers", addServer: "Add server" },
}

const { t } = useI18n({ useScope: "local", messages })

const onOpen = (server: ServerListItem) => navigateTo(`/admin/servers/${server.id}`)
</script>

<template>
  <section class="flex flex-col gap-4.5">
    <div class="flex items-center justify-between gap-2">
      <h1 class="text-2xl font-semibold">{{ t("title") }}</h1>
      <Button class="hidden sm:inline-flex">
        <Plus class="size-4" aria-hidden="true" />
        {{ t("addServer") }}
      </Button>
    </div>

    <Button class="sm:hidden">
      <Plus class="size-4" aria-hidden="true" />
      {{ t("addServer") }}
    </Button>

    <ServerListSelf @open="onOpen" />
  </section>
</template>
