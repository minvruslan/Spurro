<script setup lang="ts">
import { EditUserForm } from "@/modules/features/edit-user"

definePageMeta({ middleware: "admin", layout: "admin" })

const route = useRoute()
const id = route.params.id as string

const goBack = () => navigateTo("/admin/users")
</script>

<template>
  <div class="h-full">
    <EditUserForm :id="id" @updated="goBack" @deleted="goBack" @cancel="goBack" />
  </div>
</template>
