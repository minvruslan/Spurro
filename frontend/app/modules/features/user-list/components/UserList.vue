<script setup lang="ts">
import type { User } from "@spurro/shared"
import { Plus } from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import { ListLayout } from "@/modules/shared/components"
import { UserListSelf } from "@/modules/entities/user"
import { messages } from "../translations/UserList"

defineEmits<{ (e: "open", user: User): void; (e: "create"): void }>()

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
        {{ t("createUserAction") }}
      </Button>
    </template>

    <template #body>
      <UserListSelf @open="$emit('open', $event)" />
    </template>
  </ListLayout>
</template>
