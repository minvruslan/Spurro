<script setup lang="ts">
import { CreateUserForm } from "@/modules/features/create-user"

definePageMeta({ middleware: "admin", layout: "admin" })

const goBack = () => navigateTo("/admin/users")
</script>

<template>
  <div class="h-full">
    <CreateUserForm @created="goBack" @cancel="goBack" />
  </div>
</template>
