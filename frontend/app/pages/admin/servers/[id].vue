<script setup lang="ts">
import { EditServerForm } from "@/modules/features/edit-server"

definePageMeta({ middleware: "admin", layout: "admin" })

const route = useRoute()
const id = route.params.id as string

const goBack = () => navigateTo("/admin/servers")
</script>

<template>
  <div class="h-full">
    <EditServerForm :id="id" @updated="goBack" @cancel="goBack" />
  </div>
</template>
