<script setup lang="ts">
import { LoginVerifyCard } from "@/modules/features/login"

definePageMeta({ layout: "auth", middleware: "guest" })
</script>

<template>
  <LoginVerifyCard />
</template>
