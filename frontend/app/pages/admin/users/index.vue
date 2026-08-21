<script setup lang="ts">
import type { User } from "@spurro/api-contract"
import { UserList } from "@/modules/features/admin/user-list"

definePageMeta({ middleware: "admin", layout: "admin" })

const onOpen = (user: User) => navigateTo(`/admin/users/${user.id}`)
const onCreate = () => navigateTo("/admin/users/create")
</script>

<template>
  <UserList @open="onOpen" @create="onCreate" />
</template>
