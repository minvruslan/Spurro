<script setup lang="ts">
import { ref, watch } from "vue"
import { useMediaQuery } from "@vueuse/core"
import { Menu, X } from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetClose } from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { BrandIconWithText } from "@/modules/entities/brand"
import NavItems from "./NavItems.vue"
import LogoutButton from "./LogoutButton.vue"
import { messages } from "@/translations/admin-layout/MobileNav"

const { t } = useI18n({ useScope: "local", messages })

const open = ref(false)

const isDesktop = useMediaQuery("(min-width: 64rem)")

watch(isDesktop, (desktop) => {
  if (desktop) open.value = false
})
</script>

<template>
  <div class="flex h-14 items-center px-4">
    <Sheet v-model:open="open">
      <SheetTrigger as-child>
        <Button variant="outline" size="icon" :aria-label="t('openMenu')">
          <Menu class="size-5" aria-hidden="true" />
        </Button>
      </SheetTrigger>

      <SheetContent side="left" hide-close class="flex w-66 flex-col gap-0 p-4">
        <SheetTitle class="sr-only">{{ t("menuTitle") }}</SheetTitle>
        <div class="flex items-center justify-between gap-2 pb-3 pl-1.5">
          <BrandIconWithText />
          <SheetClose as-child>
            <Button variant="ghost" size="icon" :aria-label="t('closeMenu')">
              <X class="size-5" aria-hidden="true" />
            </Button>
          </SheetClose>
        </div>
        <NavItems @navigate="open = false" />
        <div class="mt-auto">
          <Separator class="my-3" />
          <LogoutButton />
        </div>
      </SheetContent>
    </Sheet>
  </div>
</template>
