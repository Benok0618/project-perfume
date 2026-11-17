<script setup lang="ts">
import { copy } from '~/content/copy'
import { formatPrice } from '~~/shared/utils/money'

const cart = useCartStore()
const { lines, summary, itemCount, hydrated, busy, error } = storeToRefs(cart)

onMounted(() => {
  void cart.init()
})

useSeoMeta({
  title: 'Your bag',
  description: copy.cart.emptyBody
})
</script>

<template>
  <section class="mx-auto max-w-[88rem] px-6 py-12 lg:px-10 lg:py-16">
    <div class="flex flex-wrap items-end justify-between gap-4 border-b border-default pb-6">
      <div>
        <p class="eyebrow">
          Bag
        </p>
        <h1 class="mt-2 text-3xl sm:text-4xl">
          Your bag
        </h1>
      </div>
      <p
        v-if="hydrated && itemCount > 0"
        class="text-sm text-muted"
      >
        {{ itemCount }} {{ itemCount === 1 ? 'item' : 'items' }}
      </p>
    </div>

    <UAlert
      v-if="error"
      color="error"
      variant="subtle"
      :title="error"
      class="mt-6"
    />

    <div
      v-if="!hydrated"
      class="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]"
      aria-busy="true"
      aria-label="Loading bag"
    >
      <div class="rounded-theme border border-default bg-elevated p-6">
        <div
          v-for="placeholder in 2"
          :key="placeholder"
          class="flex gap-4 py-4 first:pt-0 last:pb-0"
        >
          <div class="w-20 shrink-0 animate-pulse rounded-theme-sm bg-muted">
            <div class="aspect-[4/5]" />
          </div>
          <div class="flex-1 space-y-3 pt-1">
            <div class="h-4 w-2/3 animate-pulse rounded bg-muted" />
            <div class="h-3 w-1/3 animate-pulse rounded bg-muted" />
            <div class="h-8 w-48 animate-pulse rounded-theme-sm bg-muted" />
          </div>
        </div>
      </div>
      <div class="h-56 animate-pulse rounded-theme border border-default bg-elevated" />
    </div>

    <div
      v-else-if="lines.length === 0"
      class="mt-10 flex flex-col items-center gap-5 rounded-theme border border-default bg-elevated px-6 py-16 text-center"
    >
      <span class="flex size-16 items-center justify-center rounded-full bg-muted text-muted">
        <UIcon
          name="i-lucide-shopping-bag"
          class="size-7"
        />
      </span>
      <div>
        <h2 class="font-heading text-2xl text-highlighted">
          Your bag is empty
        </h2>
        <p class="mx-auto mt-2 max-w-[36ch] text-sm leading-relaxed text-muted">
          {{ copy.cart.emptyBody }}
        </p>
      </div>
      <UButton
        to="/shop"
        color="primary"
        size="lg"
      >
        Shop the collection
      </UButton>
    </div>

    <div
      v-else
      class="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]"
    >
      <ul class="divide-y divide-default rounded-theme border border-default bg-elevated px-5 sm:px-6">
        <li
          v-for="line in lines"
          :key="`${line.productId}-${line.sizeMl}`"
          class="py-5"
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

      <aside class="h-fit rounded-theme border border-default bg-elevated p-6 shadow-theme lg:sticky lg:top-24">
        <h2 class="font-heading text-xl text-highlighted">
          Order summary
        </h2>

        <dl class="mt-5 space-y-3 text-sm">
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
          <div class="flex items-center justify-between gap-4 border-t border-default pt-3">
            <dt class="text-default">
              Total
            </dt>
            <dd class="font-heading text-xl text-highlighted">
              {{ formatPrice(summary.totalCents) }}
            </dd>
          </div>
        </dl>

        <UButton
          to="/checkout"
          block
          color="primary"
          size="lg"
          class="mt-6"
        >
          Checkout
        </UButton>

        <UButton
          to="/shop"
          block
          color="neutral"
          variant="link"
          class="mt-2"
        >
          Continue shopping
        </UButton>

        <p class="mt-4 text-xs leading-relaxed text-muted">
          Shipping and taxes are calculated at checkout.
        </p>
      </aside>
    </div>
  </section>
</template>
