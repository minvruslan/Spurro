<script setup lang="ts">
import { LoginCard } from "@/modules/features/login"

definePageMeta({ layout: "auth", middleware: "guest" })
</script>

<template>
  <LoginCard />
</template>
