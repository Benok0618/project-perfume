<script setup lang="ts">
import type { Order, OrderStatus } from '~~/shared/types'
import { ORDER_STATUSES } from '~~/shared/types'
import { copy } from '~/content/copy'
import { formatOrderDate } from '~~/shared/utils/date'
import { deliveryMethodLabels, orderStatusLabels, paymentMethodLabels } from '~~/shared/utils/labels'
import { formatPrice } from '~~/shared/utils/money'

definePageMeta({
  middleware: 'auth'
})

const route = useRoute()
const orderId = computed(() => Number(route.params.id))
const justPlaced = computed(() => route.query.placed === '1')

const { data: order, error, refresh } = await useFetch<Order>(() => `/api/orders/${orderId.value}`, {
  key: 'order-detail'
})

if (error.value || !order.value) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Order not found',
    fatal: true
  })
}

const { user } = useUserSession()
const isAdmin = computed(() => user.value?.isAdmin === true)

const currentIndex = computed(() => order.value ? ORDER_STATUSES.indexOf(order.value.status) : -1)
const nextStatus = computed<OrderStatus | null>(() => {
  if (currentIndex.value < 0 || currentIndex.value >= ORDER_STATUSES.length - 1) return null
  return ORDER_STATUSES[currentIndex.value + 1] ?? null
})
const nextStatusLabel = computed(() => nextStatus.value ? orderStatusLabels[nextStatus.value].toLowerCase() : '')
const showTrackingField = computed(() => nextStatus.value === 'shipped' || nextStatus.value === 'out_for_delivery')

const tracking = ref('')
const advancing = ref(false)
const adminError = ref<string | null>(null)

watch(order, (value) => {
  if (value?.trackingNumber) tracking.value = value.trackingNumber
}, { immediate: true })

async function advance() {
  if (!nextStatus.value || advancing.value) return

  advancing.value = true
  adminError.value = null

  try {
    await $fetch(`/api/orders/${orderId.value}/status`, {
      method: 'POST',
      body: {
        status: nextStatus.value,
        ...(tracking.value.trim() ? { trackingNumber: tracking.value.trim() } : {})
      }
    })
    await refresh()
  } catch (caught) {
    adminError.value = apiErrorMessage(caught, 'The order status could not be updated.')
  } finally {
    advancing.value = false
  }
}

useSeoMeta({
  title: () => justPlaced.value ? 'Order placed' : `Order ${order.value?.orderNumber ?? ''}`,
  description: copy.orders.body
})
</script>

<template>
  <section class="mx-auto max-w-[88rem] px-6 py-12 lg:px-10 lg:py-16">
    <NuxtLink
      to="/orders"
      class="inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-default"
    >
      <UIcon
        name="i-lucide-arrow-left"
        class="size-4"
      />
      Orders
    </NuxtLink>

    <template v-if="order">
      <div class="page-enter mt-6 grid gap-6 border-b border-default pb-8 lg:grid-cols-12">
        <div class="lg:col-span-8">
          <p class="eyebrow">
            {{ justPlaced ? 'Thank you' : 'Order' }}
          </p>
          <h1 class="mt-2 font-heading text-[clamp(2rem,4vw,3rem)] leading-[1.08] text-highlighted">
            {{ justPlaced ? 'Order placed' : order.orderNumber }}
          </h1>
          <p
            v-if="justPlaced"
            class="mt-3 max-w-[52ch] text-sm leading-relaxed text-muted"
          >
            {{ copy.orders.confirmationBody }}
          </p>
          <p class="mt-3 text-sm text-muted">
            Order {{ order.orderNumber }} · {{ formatOrderDate(order.createdAt, true) }}
          </p>
        </div>

        <div class="flex items-start lg:col-span-4 lg:justify-end">
          <OrderStatusBadge :status="order.status" />
        </div>
      </div>

      <div class="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div class="space-y-10">
          <section>
            <h2 class="font-heading text-2xl text-highlighted">
              Tracking
            </h2>

            <OrderTimeline
              :status="order.status"
              :events="order.events"
            />

            <div class="mt-6 rounded-theme border border-default bg-elevated px-5 py-4 text-sm">
              <p v-if="order.trackingNumber">
                Tracking number
                <span class="ms-1 font-mono text-highlighted">{{ order.trackingNumber }}</span>
              </p>
              <p
                v-else
                class="text-muted"
              >
                A tracking number appears here when your order ships.
              </p>
            </div>
          </section>

          <section>
            <h2 class="font-heading text-2xl text-highlighted">
              Items
            </h2>

            <ul class="mt-4 divide-y divide-default border-y border-default">
              <li
                v-for="item in order.items"
                :key="item.id"
                class="flex gap-4 py-4"
              >
                <img
                  v-if="item.image"
                  :src="item.image"
                  :alt="item.name"
                  width="80"
                  height="100"
                  loading="lazy"
                  decoding="async"
                  class="product-art aspect-[4/5] w-16 shrink-0 rounded-theme-sm border border-default object-cover"
                >
                <div class="min-w-0 flex-1">
                  <NuxtLink
                    v-if="item.productId"
                    :to="`/product/${item.slug}`"
                    class="text-sm text-highlighted transition-colors hover:text-primary"
                  >
                    {{ item.name }}
                  </NuxtLink>
                  <p
                    v-else
                    class="text-sm text-highlighted"
                  >
                    {{ item.name }}
                  </p>
                  <p class="mt-1 text-xs text-muted">
                    {{ item.sizeMl }} ml · Qty {{ item.quantity }}
                  </p>
                </div>
                <p class="shrink-0 text-sm text-default">
                  {{ formatPrice(item.lineTotalCents) }}
                </p>
              </li>
            </ul>
          </section>

          <section v-if="isAdmin">
            <h2 class="font-heading text-2xl text-highlighted">
              Demo controls
            </h2>
            <p class="mt-2 max-w-[52ch] text-sm leading-relaxed text-muted">
              Admin only. Move this order to its next status to demo tracking.
            </p>

            <UAlert
              v-if="adminError"
              color="error"
              variant="subtle"
              :title="adminError"
              class="mt-4"
              role="alert"
            />

            <div
              v-if="nextStatus"
              class="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end"
            >
              <UFormField
                v-if="showTrackingField"
                label="Tracking number"
                name="trackingNumber"
                class="flex-1"
              >
                <UInput
                  v-model="tracking"
                  autocomplete="off"
                  size="lg"
                  :ui="{ base: 'h-12 text-base' }"
                  class="w-full"
                />
              </UFormField>

              <UButton
                color="primary"
                size="lg"
                :loading="advancing"
                @click="advance"
              >
                Mark as {{ nextStatusLabel }}
              </UButton>
            </div>

            <p
              v-else
              class="mt-4 text-sm text-muted"
            >
              This order is delivered.
            </p>
          </section>
        </div>

        <aside class="h-fit space-y-6">
          <div class="rounded-theme border border-default bg-elevated p-6">
            <h2 class="font-heading text-xl text-highlighted">
              Summary
            </h2>

            <dl class="mt-4 space-y-2 text-sm">
              <div class="flex items-center justify-between gap-4">
                <dt class="text-muted">
                  Subtotal
                </dt>
                <dd class="text-default">
                  {{ formatPrice(order.subtotalCents) }}
                </dd>
              </div>
              <div class="flex items-center justify-between gap-4">
                <dt class="text-muted">
                  Delivery
                </dt>
                <dd class="text-default">
                  {{ order.shippingCents === 0 ? 'Free' : formatPrice(order.shippingCents) }}
                </dd>
              </div>
              <div class="flex items-center justify-between gap-4 border-t border-default pt-3">
                <dt class="text-default">
                  Total
                </dt>
                <dd class="font-heading text-xl text-highlighted">
                  {{ formatPrice(order.totalCents) }}
                </dd>
              </div>
            </dl>
          </div>

          <div class="rounded-theme border border-default p-6">
            <h2 class="font-heading text-xl text-highlighted">
              Shipping address
            </h2>
            <address class="mt-3 text-sm not-italic leading-relaxed text-muted">
              {{ order.shipName }}<br>
              {{ order.shipPhone }}<br>
              {{ order.shipLine1 }}<br>
              <template v-if="order.shipLine2">
                {{ order.shipLine2 }}<br>
              </template>
              {{ order.shipCity }} {{ order.shipPostalCode }}
            </address>
          </div>

          <div class="rounded-theme border border-default p-6">
            <h2 class="font-heading text-xl text-highlighted">
              Delivery and payment
            </h2>
            <dl class="mt-3 space-y-3 text-sm">
              <div>
                <dt class="text-xs uppercase tracking-[0.14em] text-muted">
                  Delivery
                </dt>
                <dd class="mt-1 text-default">
                  {{ deliveryMethodLabels[order.deliveryMethod] }}
                </dd>
              </div>
              <div>
                <dt class="text-xs uppercase tracking-[0.14em] text-muted">
                  Payment
                </dt>
                <dd class="mt-1 text-default">
                  {{ paymentMethodLabels[order.paymentMethod] }}
                </dd>
              </div>
            </dl>
          </div>
        </aside>
      </div>
    </template>
  </section>
</template>
