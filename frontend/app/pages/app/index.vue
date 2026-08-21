<script setup lang="ts">
import type { Config } from "@vancloak/api-contract"
import { UserHome } from "@/modules/features/user/home"

definePageMeta({
  middleware: "user",
  layout: "user",
  pageTransition: { name: "page", mode: "out-in" },
})

const onOpen = (config: Config) => navigateTo(`/app/configs/${config.id}`)
const onCreate = () => navigateTo("/app/configs/create")
</script>

<template>
  <UserHome @open="onOpen" @create="onCreate" />
</template>
