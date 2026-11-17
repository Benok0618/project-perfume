<script setup lang="ts">
import { site } from '~/config/site'

const cart = useCartStore()
const { itemCount, hydrated, pulse } = storeToRefs(cart)
const { loggedIn, user } = useUserSession()
const { logout } = useAuth()

const { $gsap } = useNuxtApp()

const open = ref(false)
const mounted = ref(false)
const badgeRef = ref<HTMLElement | null>(null)
const route = useRoute()

onMounted(() => {
  mounted.value = true
})

watch(() => route.fullPath, () => {
  open.value = false
  cart.closeDrawer()
})

watch(pulse, () => {
  if (!import.meta.client || !badgeRef.value) return
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  $gsap.fromTo(badgeRef.value, { scale: 0.6 }, {
    scale: 1,
    duration: 0.35,
    ease: 'back.out(2)',
    overwrite: true
  })
})

async function signOut() {
  await logout()
  open.value = false
  await navigateTo('/')
}
</script>

<template>
  <header class="sticky top-0 z-40 border-b border-default bg-default/85 backdrop-blur-md">
    <div class="mx-auto flex h-[4.5rem] max-w-[88rem] items-center gap-8 px-6 lg:px-10">
      <NuxtLink
        to="/"
        class="shrink-0"
      >
        <AppLogo />
      </NuxtLink>

      <nav
        aria-label="Main"
        class="hidden items-center gap-8 lg:flex"
      >
        <NuxtLink
          v-for="item in site.nav"
          :key="item.to"
          :to="item.to"
          class="text-sm text-muted transition-colors hover:text-default"
        >
          {{ item.label }}
        </NuxtLink>
      </nav>

      <div class="ms-auto flex items-center gap-1 sm:gap-2">
        <div class="hidden md:block">
          <AudienceSwitcher />
        </div>

        <span class="relative inline-flex">
          <UButton
            variant="ghost"
            color="neutral"
            icon="i-lucide-shopping-bag"
            aria-label="Open bag"
            @click="cart.openDrawer()"
          />
          <span
            v-if="mounted && hydrated && itemCount > 0"
            ref="badgeRef"
            class="pointer-events-none absolute -end-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[0.625rem] font-semibold text-inverted"
          >
            {{ itemCount > 99 ? '99+' : itemCount }}
          </span>
        </span>

        <UButton
          :to="loggedIn ? '/orders' : '/login'"
          variant="ghost"
          color="neutral"
          :icon="loggedIn ? 'i-lucide-user-check' : 'i-lucide-user'"
          :aria-label="loggedIn ? 'Account and orders' : 'Sign in'"
          class="hidden sm:inline-flex"
        />
        <UButton
          variant="ghost"
          color="neutral"
          icon="i-lucide-menu"
          aria-label="Open menu"
          class="lg:hidden"
          @click="open = true"
        />
      </div>
    </div>

    <USlideover
      v-model:open="open"
      title="Menu"
      side="right"
    >
      <template #body>
        <nav
          aria-label="Mobile"
          class="flex flex-col gap-1"
        >
          <NuxtLink
            v-for="item in site.nav"
            :key="item.to"
            :to="item.to"
            class="rounded-theme-sm px-3 py-3 text-base text-default transition-colors hover:bg-elevated"
          >
            {{ item.label }}
          </NuxtLink>
          <NuxtLink
            to="/cart"
            class="rounded-theme-sm px-3 py-3 text-base text-default transition-colors hover:bg-elevated"
          >
            Cart
          </NuxtLink>
          <NuxtLink
            v-if="!loggedIn"
            to="/login"
            class="rounded-theme-sm px-3 py-3 text-base text-default transition-colors hover:bg-elevated"
          >
            Sign in
          </NuxtLink>
        </nav>

        <div
          v-if="loggedIn"
          class="mt-6 border-t border-default pt-6"
        >
          <p class="px-3 text-xs uppercase tracking-[0.16em] text-muted">
            {{ user?.name ?? 'Account' }}
          </p>
          <UButton
            variant="ghost"
            color="neutral"
            icon="i-lucide-log-out"
            class="mt-2 w-full justify-start px-3 py-3"
            @click="signOut"
          >
            Sign out
          </UButton>
        </div>

        <div class="mt-8 border-t border-default pt-6">
          <p class="text-sm text-muted">
            Audience
          </p>
          <AudienceSwitcher class="mt-3" />
        </div>
      </template>
    </USlideover>
  </header>
</template>
