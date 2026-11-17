<script setup lang="ts">
import type { CartSummary, DeliveryMethod, Order } from '~~/shared/types'
import { checkoutSchema } from '~~/shared/schemas/order'
import type { CheckoutInput } from '~~/shared/schemas/order'
import { copy } from '~/content/copy'
import { formatPrice } from '~~/shared/utils/money'
import { shippingForDelivery } from '~~/shared/utils/cart'

definePageMeta({
  middleware: 'auth'
})

const cart = useCartStore()

const state = reactive<CheckoutInput>({
  shipName: '',
  shipPhone: '',
  shipLine1: '',
  shipLine2: '',
  shipCity: '',
  shipPostalCode: '',
  deliveryMethod: 'standard',
  paymentMethod: 'cod'
})

const placing = ref(false)
const serverError = ref<string | null>(null)

const emptySummary: CartSummary = {
  items: [],
  itemCount: 0,
  subtotalCents: 0,
  shippingCents: 0,
  totalCents: 0
}

const { data: cartData, status, error, refresh } = await useFetch<CartSummary>('/api/cart', {
  key: 'checkout-cart'
})

const summary = computed<CartSummary>(() => cartData.value ?? emptySummary)
const pending = computed(() => status.value === 'pending')
const itemCountLabel = computed(() => summary.value.itemCount === 1 ? '1 item' : `${summary.value.itemCount} items`)

const deliveryOptions = computed<{ value: DeliveryMethod, title: string, description: string, priceCents: number }[]>(() => [
  {
    value: 'standard',
    title: 'Standard delivery',
    description: '3–5 business days',
    priceCents: shippingForDelivery(summary.value.subtotalCents, 'standard')
  },
  {
    value: 'express',
    title: 'Express delivery',
    description: '1–2 business days',
    priceCents: shippingForDelivery(summary.value.subtotalCents, 'express')
  }
])

const paymentOptions = [
  { value: 'cod', title: 'Cash on delivery', description: 'Pay the courier when your order arrives.' },
  { value: 'card', title: 'Card (demo)', description: 'A mock payment. No card details are collected.' }
] as const

const shippingCents = computed(() => shippingForDelivery(summary.value.subtotalCents, state.deliveryMethod))
const totalCents = computed(() => summary.value.subtotalCents + shippingCents.value)

async function onSubmit(event: { data: CheckoutInput }) {
  if (placing.value) return

  placing.value = true
  serverError.value = null

  try {
    const order = await $fetch<Order>('/api/orders', {
      method: 'POST',
      body: event.data
    })

    cart.reset()
    await navigateTo(`/orders/${order.id}?placed=1`)
  } catch (caught) {
    serverError.value = apiErrorMessage(caught, 'Your order could not be placed. Please try again.')
    await refresh()
  } finally {
    placing.value = false
  }
}

useSeoMeta({
  title: 'Checkout',
  description: copy.checkout.body
})
</script>

<template>
  <section class="mx-auto max-w-[88rem] px-6 py-12 lg:px-10 lg:py-16">
    <div class="page-enter">
      <NuxtLink
        to="/cart"
        class="inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-default"
      >
        <UIcon
          name="i-lucide-arrow-left"
          class="size-4"
        />
        Back to bag
      </NuxtLink>

      <p class="eyebrow mt-6">
        Checkout
      </p>
      <div class="mt-3 flex flex-wrap items-end justify-between gap-4">
        <h1 class="font-heading text-[clamp(2.25rem,4vw,3rem)] leading-[1.06] text-highlighted">
          Checkout
        </h1>
        <p
          v-if="summary.itemCount > 0"
          class="text-sm text-muted"
        >
          {{ itemCountLabel }}
        </p>
      </div>
      <p class="mt-3 max-w-[60ch] text-sm leading-relaxed text-muted">
        {{ copy.checkout.body }}
      </p>
    </div>

    <UAlert
      v-if="error"
      color="error"
      variant="subtle"
      class="mt-8"
      role="alert"
      title="Could not load your bag"
      description="Check your connection and try again."
      :actions="[{ label: 'Retry', onClick: () => refresh() }]"
    />

    <div
      v-if="pending"
      class="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_24rem]"
      aria-busy="true"
      aria-label="Loading checkout"
    >
      <div class="space-y-4">
        <USkeleton class="h-12 w-full rounded-theme" />
        <USkeleton class="h-12 w-full rounded-theme" />
        <USkeleton class="h-12 w-2/3 rounded-theme" />
      </div>
      <USkeleton class="h-64 w-full rounded-theme" />
    </div>

    <div
      v-else-if="!summary.items.length && !error"
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
          {{ copy.checkout.emptyBody }}
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
      v-else-if="summary.items.length"
      class="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_24rem]"
    >
      <UForm
        :schema="checkoutSchema"
        :state="state"
        class="space-y-10"
        @submit="onSubmit"
      >
        <fieldset>
          <legend class="font-heading text-2xl text-highlighted">
            Shipping address
          </legend>

          <div class="mt-5 grid gap-4 sm:grid-cols-2">
            <UFormField
              label="Full name"
              name="shipName"
            >
              <UInput
                v-model="state.shipName"
                autocomplete="name"
                size="lg"
                :ui="{ base: 'h-12 text-base' }"
                class="w-full"
              />
            </UFormField>

            <UFormField
              label="Phone"
              name="shipPhone"
            >
              <UInput
                v-model="state.shipPhone"
                type="tel"
                inputmode="tel"
                autocomplete="tel"
                size="lg"
                :ui="{ base: 'h-12 text-base' }"
                class="w-full"
              />
            </UFormField>

            <UFormField
              label="Address line 1"
              name="shipLine1"
              class="sm:col-span-2"
            >
              <UInput
                v-model="state.shipLine1"
                autocomplete="address-line1"
                size="lg"
                :ui="{ base: 'h-12 text-base' }"
                class="w-full"
              />
            </UFormField>

            <UFormField
              label="Address line 2 (optional)"
              name="shipLine2"
              class="sm:col-span-2"
            >
              <UInput
                v-model="state.shipLine2"
                autocomplete="address-line2"
                size="lg"
                :ui="{ base: 'h-12 text-base' }"
                class="w-full"
              />
            </UFormField>

            <UFormField
              label="City"
              name="shipCity"
            >
              <UInput
                v-model="state.shipCity"
                autocomplete="address-level2"
                size="lg"
                :ui="{ base: 'h-12 text-base' }"
                class="w-full"
              />
            </UFormField>

            <UFormField
              label="Postal code"
              name="shipPostalCode"
            >
              <UInput
                v-model="state.shipPostalCode"
                autocomplete="postal-code"
                inputmode="numeric"
                size="lg"
                :ui="{ base: 'h-12 text-base' }"
                class="w-full"
              />
            </UFormField>
          </div>
        </fieldset>

        <fieldset>
          <legend class="font-heading text-2xl text-highlighted">
            Delivery method
          </legend>

          <div class="mt-5 grid gap-3">
            <label
              v-for="option in deliveryOptions"
              :key="option.value"
              class="block cursor-pointer"
            >
              <input
                v-model="state.deliveryMethod"
                type="radio"
                name="deliveryMethod"
                :value="option.value"
                class="peer sr-only"
              >
              <span class="flex min-h-16 items-start justify-between gap-4 rounded-theme border border-default p-4 transition-colors peer-checked:border-primary peer-checked:bg-primary/5 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary">
                <span>
                  <span class="block text-sm text-highlighted">{{ option.title }}</span>
                  <span class="mt-0.5 block text-xs text-muted">{{ option.description }}</span>
                </span>
                <span class="shrink-0 text-sm text-default">
                  {{ option.priceCents === 0 ? 'Free' : formatPrice(option.priceCents) }}
                </span>
              </span>
            </label>
          </div>
        </fieldset>

        <fieldset>
          <legend class="font-heading text-2xl text-highlighted">
            Payment method
          </legend>

          <div class="mt-5 grid gap-3">
            <label
              v-for="option in paymentOptions"
              :key="option.value"
              class="block cursor-pointer"
            >
              <input
                v-model="state.paymentMethod"
                type="radio"
                name="paymentMethod"
                :value="option.value"
                class="peer sr-only"
              >
              <span class="flex min-h-16 items-start gap-4 rounded-theme border border-default p-4 transition-colors peer-checked:border-primary peer-checked:bg-primary/5 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary">
                <span>
                  <span class="block text-sm text-highlighted">{{ option.title }}</span>
                  <span class="mt-0.5 block text-xs text-muted">{{ option.description }}</span>
                </span>
              </span>
            </label>
          </div>
        </fieldset>

        <div class="border-t border-default pt-6">
          <UAlert
            v-if="serverError"
            color="error"
            variant="subtle"
            :title="serverError"
            class="mb-4"
            role="alert"
          />

          <UButton
            type="submit"
            block
            size="lg"
            color="primary"
            :loading="placing"
          >
            Place order
          </UButton>

          <p class="mt-3 text-xs leading-relaxed text-muted">
            Payment is mocked for this demo. No card details are collected or stored.
          </p>
        </div>
      </UForm>

      <aside class="order-first h-fit rounded-theme border border-default bg-elevated p-6 shadow-theme lg:order-last lg:sticky lg:top-24">
        <h2 class="font-heading text-xl text-highlighted">
          Order summary
        </h2>

        <ul class="mt-5 divide-y divide-default">
          <li
            v-for="line in summary.items"
            :key="`${line.productId}-${line.sizeMl}`"
            class="flex gap-3 py-4 first:pt-0"
          >
            <img
              :src="line.image"
              :alt="line.name"
              width="80"
              height="100"
              loading="lazy"
              decoding="async"
              class="product-art aspect-[4/5] w-14 shrink-0 rounded-theme-sm border border-default object-cover"
            >
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm text-highlighted">
                {{ line.name }}
              </p>
              <p class="mt-0.5 text-xs text-muted">
                {{ line.sizeMl }} ml · Qty {{ line.quantity }}
              </p>
            </div>
            <p class="shrink-0 text-sm text-default">
              {{ formatPrice(line.lineTotalCents) }}
            </p>
          </li>
        </ul>

        <dl class="mt-2 space-y-2 border-t border-default pt-4 text-sm">
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
              Delivery
            </dt>
            <dd class="text-default">
              {{ shippingCents === 0 ? 'Free' : formatPrice(shippingCents) }}
            </dd>
          </div>
          <div class="flex items-center justify-between gap-4 border-t border-default pt-3">
            <dt class="text-default">
              Total
            </dt>
            <dd class="font-heading text-xl text-highlighted">
              {{ formatPrice(totalCents) }}
            </dd>
          </div>
        </dl>

        <p class="mt-5 text-xs leading-relaxed text-muted">
          {{ copy.checkout.note }}
        </p>
      </aside>
    </div>
  </section>
</template>
