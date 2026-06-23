<script setup lang="ts">
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { messages } from "@/translations/ConfirmationDialog"

const { t } = useI18n({ useScope: "local", messages })
const { state, respond } = useConfirmationDialog()

const onOpenChange = (open: boolean) => {
  if (!open) respond(false)
}
</script>

<template>
  <Dialog :open="state.open" @update:open="onOpenChange">
    <DialogContent class="sm:max-w-md">
      <DialogHeader class="gap-4">
        <DialogTitle>{{ state.title }}</DialogTitle>
        <DialogDescription v-if="state.description">{{ state.description }}</DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <Button variant="outline" @click="respond(false)">
          {{ state.cancelButtonText ?? t("cancelAction") }}
        </Button>
        <Button :variant="state.destructive ? 'destructive' : 'default'" @click="respond(true)">
          {{ state.confirmButtonText ?? t("confirmAction") }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
