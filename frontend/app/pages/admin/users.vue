<script setup lang="ts">
import type { User } from "@spurro/shared"
import { Plus } from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import { UserListSelf } from "@/modules/entities/user"

definePageMeta({ middleware: "admin", layout: "admin" })

const messages = {
  ru: { title: "Пользователи", addUser: "Добавить пользователя" },
  en: { title: "Users", addUser: "Add user" },
}

const { t } = useI18n({ useScope: "local", messages })

const onOpen = (user: User) => navigateTo(`/admin/users/${user.id}`)
</script>

<template>
  <section class="flex flex-col gap-4.5">
    <div class="flex items-center justify-between gap-2">
      <h1 class="text-2xl font-semibold">{{ t("title") }}</h1>
      <Button class="hidden sm:inline-flex">
        <Plus class="size-4" aria-hidden="true" />
        {{ t("addUser") }}
      </Button>
    </div>

    <Button class="sm:hidden">
      <Plus class="size-4" aria-hidden="true" />
      {{ t("addUser") }}
    </Button>

    <UserListSelf @open="onOpen" />
  </section>
</template>
