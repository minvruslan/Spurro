<script setup lang="ts">
import type { User } from "@spurro/shared"
import { Plus } from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import { UserListSelf } from "@/modules/entities/user"

definePageMeta({ middleware: "admin", layout: "admin" })

const messages = {
  ru: { title: "Пользователи", addUser: "Создать пользователя" },
  en: { title: "Users", addUser: "Create user" },
}

const { t } = useI18n({ useScope: "local", messages })

const onOpen = (user: User) => navigateTo(`/admin/users/${user.id}`)
</script>

<template>
  <section class="flex flex-col gap-4.5">
    <div class="flex items-center justify-between gap-2">
      <h1 class="text-2xl font-semibold">{{ t("title") }}</h1>
      <Button as-child class="hidden sm:inline-flex">
        <NuxtLink to="/admin/users/create">
          <Plus class="size-4" aria-hidden="true" />
          {{ t("addUser") }}
        </NuxtLink>
      </Button>
    </div>

    <Button as-child class="sm:hidden">
      <NuxtLink to="/admin/users/create">
        <Plus class="size-4" aria-hidden="true" />
        {{ t("addUser") }}
      </NuxtLink>
    </Button>

    <UserListSelf @open="onOpen" />
  </section>
</template>
