<template>
  <main class="relative min-h-dvh w-full flex items-center justify-center bg-background p-6">
    <div class="absolute right-4 top-4 flex items-center gap-2">
      <ThemeSwitcher class="w-36" />
      <LanguageSwitcher class="w-36" />
    </div>
    <Card class="w-full max-w-sm gap-0 rounded-lg p-8">
      <slot />
    </Card>
  </main>
</template>
