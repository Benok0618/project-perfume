<template>
  <div class="flex min-h-dvh flex-col">
    <a
      href="#main"
      class="sr-only rounded-theme-sm bg-primary px-4 py-2 text-sm text-inverted focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50"
    >
      Skip to content
    </a>

    <AppHeader />

    <main
      id="main"
      class="flex-1"
    >
      <slot />
    </main>

    <AppFooter />

    <CartDrawer />
  </div>
</template>
