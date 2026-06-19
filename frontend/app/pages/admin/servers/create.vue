<script setup lang="ts">
import { ArrowLeft } from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { CreateServerFormSelf } from "@/modules/features/create-server"

definePageMeta({ middleware: "admin", layout: "admin" })

const messages = {
  ru: { title: "Новый сервер", back: "Назад" },
  en: { title: "New server", back: "Back" },
}

const { t } = useI18n({ useScope: "local", messages })

const goBack = () => navigateTo("/admin/servers")
</script>

<template>
  <div>
    <Button as-child variant="ghost" size="sm" class="-ml-2 mb-4">
      <NuxtLink to="/admin/servers">
        <ArrowLeft class="size-4" aria-hidden="true" />
        {{ t("back") }}
      </NuxtLink>
    </Button>
    <h1 class="mb-5 text-2xl font-semibold tracking-tight">{{ t("title") }}</h1>
    <Separator class="mb-5" />
    <CreateServerFormSelf @created="goBack" />
  </div>
</template>
