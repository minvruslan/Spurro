<script setup lang="ts">
import { useLogin } from "../composables/useLogin"
import LoginForm from "./LoginForm.vue"
import LoginEmailSent from "./LoginEmailSent.vue"

const { email, pending, magicLinkSent, submit, reset } = useLogin()
</script>

<template>
  <LoginForm v-if="!magicLinkSent" v-model:email="email" :pending="pending" @submit="submit" />
  <LoginEmailSent v-else :email="email" @use-different-email="reset" />
</template>
