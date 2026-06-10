<template>
  <main class="relative min-h-dvh w-full flex items-center justify-center bg-background p-6">
    <LanguageSwitcher class="absolute right-4 top-4 w-36" />
    <Card class="w-full max-w-sm gap-0 rounded-lg p-8">
      <slot />
    </Card>
  </main>
</template>
