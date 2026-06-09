<template>
  <div class="flex min-h-dvh flex-col bg-background">
    <AdminTopBar />
    <main class="mx-auto w-full max-w-205 flex-1 px-4 py-4 md:px-7 md:py-7">
      <slot />
    </main>
  </div>
</template>
