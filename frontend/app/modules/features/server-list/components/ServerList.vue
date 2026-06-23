<script setup lang="ts">
import type { Server } from "@spurro/shared"
import { Plus } from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import { ListLayout } from "@/modules/shared/components"
import { ServerListSelf } from "@/modules/entities/server"
import { messages } from "../translations/ServerList"

defineEmits<{ (e: "open", server: Server): void; (e: "create"): void }>()

const { t } = useI18n({ useScope: "local", messages })
</script>

<template>
  <ListLayout>
    <template #title>
      <h1 class="text-2xl font-semibold">{{ t("title") }}</h1>
    </template>

    <template #action>
      <Button class="w-full sm:w-auto" @click="$emit('create')">
        <Plus class="size-4" aria-hidden="true" />
        {{ t("createServerAction") }}
      </Button>
    </template>

    <template #body>
      <ServerListSelf @open="$emit('open', $event)" />
    </template>
  </ListLayout>
</template>
