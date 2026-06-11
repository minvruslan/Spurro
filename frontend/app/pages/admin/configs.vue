<script setup lang="ts">
import type { Config } from "@spurro/shared"
import { Plus } from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import { ConfigListSelf } from "@/modules/entities/config"
import { ConfigLimitListSelf } from "@/modules/entities/config-limit"

definePageMeta({ middleware: "admin", layout: "admin" })

const messages = {
  ru: { title: "Конфигурации", addConfig: "Добавить конфигурацию" },
  en: { title: "Configurations", addConfig: "Add configuration" },
}

const { t } = useI18n({ useScope: "local", messages })

const onOpen = (config: Config) => navigateTo(`/admin/configs/${config.id}`)
</script>

<template>
  <section class="flex flex-col gap-4.5">
    <div class="flex items-center justify-between gap-2">
      <h1 class="text-2xl font-semibold">{{ t("title") }}</h1>
      <Button class="hidden sm:inline-flex">
        <Plus class="size-4" aria-hidden="true" />
        {{ t("addConfig") }}
      </Button>
    </div>

    <Button class="sm:hidden">
      <Plus class="size-4" aria-hidden="true" />
      {{ t("addConfig") }}
    </Button>

    <ConfigLimitListSelf :with-limit="true" />

    <ConfigListSelf @open="onOpen" />
  </section>
</template>
