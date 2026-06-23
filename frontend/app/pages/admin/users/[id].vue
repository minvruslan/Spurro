<script setup lang="ts">
import { UpdateUserForm } from "@/modules/features/update-user"

definePageMeta({
  middleware: "admin",
  layout: "admin",
  key: (route) => route.params.id as string,
})

const route = useRoute()
const id = route.params.id as string

const goBack = () => navigateTo("/admin/users")
</script>

<template>
  <UpdateUserForm :id="id" @updated="goBack" @deleted="goBack" @cancel="goBack" />
</template>
