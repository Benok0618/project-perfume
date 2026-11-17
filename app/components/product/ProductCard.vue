<script setup lang="ts">
import type { Product } from '~~/shared/types'
import { formatPrice } from '~~/shared/utils/money'
import { scentFamilyLabels } from '~~/shared/utils/labels'

const props = defineProps<{
  product: Product
  index: number
}>()

const route = useRoute()

const to = computed(() => ({
  path: route.path,
  query: { ...route.query, product: props.product.slug }
}))

const fromPrice = computed(() => {
  const prices = props.product.sizes.map(size => size.priceCents)
  return formatPrice(prices.length ? Math.min(...prices) : 0)
})
</script>

<template>
  <li
    class="product-item"
    :style="{ '--index': index }"
  >
    <NuxtLink
      :to="to"
      class="group block"
    >
      <div class="relative overflow-hidden rounded-theme border border-default bg-muted">
        <img
          :src="product.images[0]"
          :alt="product.name"
          width="800"
          height="1000"
          loading="lazy"
          decoding="async"
          class="product-art aspect-[4/5] w-full object-cover transition-transform duration-700 ease-theme group-hover:scale-[1.04] motion-reduce:transform-none"
        >

        <span class="absolute start-3 top-3">
          <UBadge
            color="neutral"
            variant="subtle"
            size="sm"
            class="backdrop-blur-sm"
          >
            <span
              aria-hidden="true"
              class="me-1.5 inline-block size-1.5 rounded-full bg-warm"
            />
            {{ scentFamilyLabels[product.scentFamily] }}
          </UBadge>
        </span>

        <span
          aria-hidden="true"
          class="absolute inset-x-0 bottom-0 h-px origin-left scale-x-0 bg-highlight transition-transform duration-500 ease-theme group-hover:scale-x-100 motion-reduce:transform-none"
        />
      </div>

      <div class="mt-4 flex items-baseline justify-between gap-4">
        <div class="min-w-0">
          <h3 class="truncate font-heading text-lg leading-snug text-highlighted">
            {{ product.name }}
          </h3>
          <p class="mt-1 truncate text-sm text-muted">
            {{ product.tagline }}
          </p>
        </div>
        <p class="shrink-0 text-sm text-default">
          <span class="text-muted">From</span> {{ fromPrice }}
        </p>
      </div>
    </NuxtLink>
  </li>
</template>
