<script setup lang="ts">
import type { OrderSummary } from '~~/shared/types'
import { copy } from '~/content/copy'
import { formatOrderDate } from '~~/shared/utils/date'
import { formatPrice } from '~~/shared/utils/money'

definePageMeta({
  middleware: 'auth'
})

const { data: orders, status, error, refresh } = await useFetch<OrderSummary[]>('/api/orders', {
  key: 'orders'
})

const list = computed(() => orders.value ?? [])
const pending = computed(() => status.value === 'pending')

useSeoMeta({
  title: 'Orders',
  description: copy.orders.body
})
</script>

<template>
  <section class="mx-auto max-w-[88rem] px-6 py-12 lg:px-10 lg:py-16">
    <div class="page-enter border-b border-default pb-8">
      <p class="eyebrow">
        Orders
      </p>
      <h1 class="mt-2 font-heading text-[clamp(2.25rem,4vw,3rem)] leading-[1.06] text-highlighted">
        Orders
      </h1>
      <p class="mt-3 max-w-[56ch] text-sm leading-relaxed text-muted">
        {{ copy.orders.body }}
      </p>
    </div>

    <UAlert
      v-if="error"
      color="error"
      variant="subtle"
      class="mt-8"
      role="alert"
      title="Could not load your orders"
      description="Check your connection and try again."
      :actions="[{ label: 'Retry', onClick: () => refresh() }]"
    />

    <div
      v-if="pending"
      class="mt-8 space-y-4"
      aria-busy="true"
      aria-label="Loading orders"
    >
      <USkeleton
        v-for="placeholder in 3"
        :key="placeholder"
        class="h-24 w-full rounded-theme"
      />
    </div>

    <div
      v-else-if="!list.length && !error"
      class="mt-10 flex flex-col items-center gap-5 rounded-theme border border-default bg-elevated px-6 py-16 text-center"
    >
      <span class="flex size-16 items-center justify-center rounded-full bg-muted text-muted">
        <UIcon
          name="i-lucide-package"
          class="size-7"
        />
      </span>
      <div>
        <h2 class="font-heading text-2xl text-highlighted">
          No orders yet
        </h2>
        <p class="mx-auto mt-2 max-w-[36ch] text-sm leading-relaxed text-muted">
          {{ copy.orders.emptyBody }}
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

    <ul
      v-else-if="list.length"
      class="mt-8 divide-y divide-default border-y border-default"
    >
      <li
        v-for="order in list"
        :key="order.id"
      >
        <NuxtLink
          :to="`/orders/${order.id}`"
          class="group grid gap-4 py-5 transition-colors hover:bg-elevated sm:grid-cols-[4rem_minmax(0,1fr)_auto] sm:items-center"
        >
          <img
            v-if="order.image"
            :src="order.image"
            alt=""
            width="80"
            height="100"
            loading="lazy"
            decoding="async"
            class="product-art aspect-[4/5] w-16 rounded-theme-sm border border-default object-cover"
          >
          <span
            v-else
            class="flex aspect-[4/5] w-16 items-center justify-center rounded-theme-sm border border-default bg-muted text-muted"
          >
            <UIcon
              name="i-lucide-package"
              class="size-5"
            />
          </span>

          <div class="min-w-0">
            <p class="font-heading text-lg leading-snug text-highlighted transition-colors group-hover:text-primary">
              {{ order.orderNumber }}
            </p>
            <p class="mt-1 text-xs text-muted">
              {{ formatOrderDate(order.createdAt) }} · {{ order.itemCount }} {{ order.itemCount === 1 ? 'item' : 'items' }}
            </p>
          </div>

          <div class="flex items-center gap-3 sm:flex-col sm:items-end sm:gap-2">
            <OrderStatusBadge :status="order.status" />
            <p class="text-sm text-default">
              {{ formatPrice(order.totalCents) }}
            </p>
          </div>
        </NuxtLink>
      </li>
    </ul>
  </section>
</template>
