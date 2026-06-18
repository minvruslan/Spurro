<script setup lang="ts">
import type { User } from "@spurro/shared"
import { ListErrorState } from "@/modules/shared/components"
import UserList from "./UserList.vue"
import { useUsers } from "../composables/useUsers"
import { messages } from "../translations/UserListSelf"

defineEmits<{ (e: "open", user: User): void }>()

const { t } = useI18n({ useScope: "local", messages })
const { users, status, error } = useUsers()
</script>

<template>
  <ListErrorState v-if="error" :title="t('loadError')" />

  <UserList v-else :users="users" :pending="status === 'pending'" @open="$emit('open', $event)" />
</template>
