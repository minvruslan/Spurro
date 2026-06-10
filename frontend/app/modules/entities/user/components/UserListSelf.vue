<script setup lang="ts">
import type { User } from "@spurro/shared"
import UserList from "./UserList.vue"
import { useUsers } from "../composables/useUsers"
import { messages } from "../translations/UserListSelf"

defineEmits<{ (e: "open", user: User): void }>()

const { t } = useI18n({ useScope: "local", messages })
const { users, status, error } = useUsers()
</script>

<template>
  <p v-if="error" role="alert" class="text-sm text-muted-foreground">{{ t("loadError") }}</p>

  <UserList v-else :users="users" :pending="status === 'pending'" @open="$emit('open', $event)" />
</template>
