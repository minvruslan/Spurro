<script setup lang="ts">
import type { Server } from "@spurro/shared"
import { useProtocols } from "@/modules/entities/protocol"
import { useCreateServer } from "../composables/useCreateServer"
import type { CreateServerFormValues } from "../types"
import CreateServerForm from "./CreateServerForm.vue"

const emit = defineEmits<{ (e: "created", server: Server): void }>()

const { protocols } = useProtocols()
const { pending, error, submit } = useCreateServer()

const onSubmit = async (values: CreateServerFormValues) => {
  const server = await submit(values)
  if (server) emit("created", server)
}
</script>

<template>
  <CreateServerForm
    v-if="protocols.length"
    :protocols="protocols"
    :pending="pending"
    :error="Boolean(error)"
    @submit="onSubmit"
  />
</template>
