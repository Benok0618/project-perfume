<script setup lang="ts">
import { copy } from '~/content/copy'
import { formatPrice } from '~~/shared/utils/money'

const cart = useCartStore()
const { drawerOpen, lines, itemCount, summary, hydrated, busy, error } = storeToRefs(cart)

const { $gsap } = useNuxtApp()

const bodyRef = ref<HTMLElement | null>(null)
let revealContext: ReturnType<typeof $gsap.context> | null = null

const description = computed(() => itemCount.value === 1 ? '1 item' : `${itemCount.value} items`)

function clearReveal() {
  revealContext?.revert()
  revealContext = null
}

function reveal() {
  if (!import.meta.client || !bodyRef.value) return

  clearReveal()

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  const targets = bodyRef.value.querySelectorAll('[data-cart-line]')
  if (!targets.length) return

  revealContext = $gsap.context(() => {
    $gsap.from(targets, {
      opacity: 0,
      y: 14,
      duration: 0.4,
      stagger: 0.05,
      ease: 'power3.out',
      clearProps: 'opacity,transform'
    })
  }, bodyRef.value)
}

onBeforeUnmount(clearReveal)
</script>

<template>
  <USlideover
    v-model:open="drawerOpen"
    title="Your bag"
    :description="description"
    side="right"
    :ui="{ content: 'max-w-md' }"
    @after:enter="reveal"
    @after:leave="clearReveal"
  >
    <template #body>
      <div
        ref="bodyRef"
        class="flex min-h-full flex-col"
      >
        <UAlert
          v-if="error"
          color="error"
          variant="subtle"
          :title="error"
          class="mb-4"
        />

        <div
          v-if="!hydrated"
          class="space-y-6"
          aria-busy="true"
          aria-label="Loading bag"
        >
          <div
            v-for="placeholder in 2"
            :key="placeholder"
            class="flex gap-4"
          >
            <div class="w-16 shrink-0 animate-pulse rounded-theme-sm bg-elevated sm:w-20">
              <div class="aspect-[4/5]" />
            </div>
            <div class="flex-1 space-y-3 pt-1">
              <div class="h-4 w-2/3 animate-pulse rounded bg-elevated" />
              <div class="h-3 w-1/3 animate-pulse rounded bg-elevated" />
              <div class="h-8 w-40 animate-pulse rounded-theme-sm bg-elevated" />
            </div>
          </div>
        </div>

        <div
          v-else-if="lines.length === 0"
          class="flex flex-1 flex-col items-center justify-center gap-5 py-16 text-center"
        >
          <span class="flex size-14 items-center justify-center rounded-full bg-elevated text-muted">
            <UIcon
              name="i-lucide-shopping-bag"
              class="size-6"
            />
          </span>
          <div>
            <p class="font-heading text-xl text-highlighted">
              Your bag is empty
            </p>
            <p class="mx-auto mt-2 max-w-[32ch] text-sm leading-relaxed text-muted">
              {{ copy.cart.emptyBody }}
            </p>
          </div>
          <UButton
            to="/shop"
            color="primary"
            @click="drawerOpen = false"
          >
            Shop the collection
          </UButton>
        </div>

        <ul
          v-else
          class="flex-1 divide-y divide-default"
        >
          <li
            v-for="line in lines"
            :key="`${line.productId}-${line.sizeMl}`"
            class="py-4 first:pt-0"
            data-cart-line
          >
            <CartLineItem
              :line="line"
              :disabled="busy"
              @update:quantity="cart.updateQuantity(line.productId, line.sizeMl, $event)"
              @update:size="cart.changeSize(line.productId, line.sizeMl, $event)"
              @remove="cart.remove(line.productId, line.sizeMl)"
            />
          </li>
        </ul>
      </div>
    </template>

    <template #footer>
      <div
        v-if="lines.length > 0"
        class="w-full space-y-4"
      >
        <dl class="space-y-2 text-sm">
          <div class="flex items-center justify-between gap-4">
            <dt class="text-muted">
              Subtotal
            </dt>
            <dd class="text-default">
              {{ formatPrice(summary.subtotalCents) }}
            </dd>
          </div>
          <div class="flex items-center justify-between gap-4">
            <dt class="text-muted">
              Shipping estimate
            </dt>
            <dd class="text-default">
              {{ summary.shippingCents === 0 ? 'Free' : formatPrice(summary.shippingCents) }}
            </dd>
          </div>
          <div class="flex items-center justify-between gap-4 border-t border-default pt-2">
            <dt class="text-default">
              Total
            </dt>
            <dd class="font-heading text-lg text-highlighted">
              {{ formatPrice(summary.totalCents) }}
            </dd>
          </div>
        </dl>

        <div class="grid gap-2">
          <UButton
            to="/checkout"
            block
            color="primary"
            size="lg"
            @click="drawerOpen = false"
          >
            Checkout
          </UButton>
          <UButton
            to="/cart"
            block
            color="neutral"
            variant="outline"
            @click="drawerOpen = false"
          >
            View bag
          </UButton>
        </div>
      </div>
    </template>
  </USlideover>
</template>
