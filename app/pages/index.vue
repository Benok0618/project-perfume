<script setup lang="ts">
import type { Product } from '~~/shared/types'
import type { ProductListResponse } from '~~/shared/schemas/product'
import { copy } from '~/content/copy'
import { site } from '~/config/site'
import { HERO_MEDIA } from '~/config/themes'
import { useAudienceStore } from '~/stores/audience'
import { formatPrice } from '~~/shared/utils/money'
import { scentFamilyLabels } from '~~/shared/utils/labels'

const { audience } = storeToRefs(useAudienceStore())

const { data } = await useFetch<ProductListResponse>('/api/products', {
  key: 'landing-products',
  query: { sort: 'featured' }
})

const allProducts = computed(() => data.value?.products ?? [])
const scopedProducts = computed(() => allProducts.value.filter(product =>
  product.audience === audience.value || (audience.value !== 'unisex' && product.audience === 'unisex')
))

const featured = computed(() => scopedProducts.value.find(product => product.isFeatured)
  ?? scopedProducts.value[0]
  ?? allProducts.value[0]
  ?? null)

const collection = computed(() => scopedProducts.value.slice(0, 4))

const noteRows = computed(() => [
  { label: copy.notes.items[0]?.label ?? 'Top notes', notes: featured.value?.topNotes ?? [] },
  { label: copy.notes.items[1]?.label ?? 'Heart notes', notes: featured.value?.heartNotes ?? [] },
  { label: copy.notes.items[2]?.label ?? 'Base notes', notes: featured.value?.baseNotes ?? [] }
])

function fromPrice(product: Product) {
  const prices = product.sizes.map(size => size.priceCents)
  return formatPrice(prices.length ? Math.min(...prices) : 0)
}

const siteUrl = useSiteUrl()

useSeoMeta({
  title: 'Lorem ipsum dolor',
  description: copy.hero.body,
  ogTitle: site.name,
  ogDescription: copy.hero.body,
  ogImage: `${siteUrl.value}${HERO_MEDIA.poster}`,
  ogUrl: siteUrl.value,
  twitterCard: 'summary_large_image'
})

useHead({
  link: [
    { rel: 'canonical', href: siteUrl.value }
  ]
})
</script>

<template>
  <div>
    <LandingHero :product="featured" />

    <section
      id="collection"
      class="border-t border-default"
    >
      <div class="mx-auto max-w-[88rem] px-6 py-20 lg:px-10 lg:py-28">
        <div class="grid gap-8 lg:grid-cols-12 lg:items-end">
          <div class="lg:col-span-7">
            <p class="eyebrow">
              {{ copy.collection.eyebrow }}
            </p>
            <h2 class="mt-5 max-w-[18ch] font-heading text-[clamp(2.25rem,4.4vw,3.75rem)] leading-[1.05] text-balance">
              {{ copy.collection.title }}
            </h2>
          </div>

          <div class="lg:col-span-4 lg:col-start-9">
            <p class="max-w-[40ch] text-sm leading-relaxed text-muted">
              {{ copy.collection.body }}
            </p>
            <UButton
              to="/shop"
              color="neutral"
              variant="link"
              trailing-icon="i-lucide-arrow-right"
              :label="copy.collection.cta"
              class="mt-4 px-0"
            />
          </div>
        </div>

        <ul class="mt-12 grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-4">
          <li
            v-for="(product, index) in collection"
            :key="product.id"
            class="product-item"
            :style="{ '--index': index }"
          >
            <NuxtLink
              :to="`/product/${product.slug}`"
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
                    {{ scentFamilyLabels[product.scentFamily] }}
                  </UBadge>
                </span>
              </div>

              <div class="mt-4 flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
                <div class="min-w-0">
                  <h3 class="font-heading text-lg leading-snug text-highlighted">
                    {{ product.name }}
                  </h3>
                  <p class="mt-1 text-sm text-muted">
                    {{ product.tagline }}
                  </p>
                </div>
                <p class="shrink-0 text-sm text-default">
                  <span class="text-muted">From</span> {{ fromPrice(product) }}
                </p>
              </div>
            </NuxtLink>
          </li>
        </ul>
      </div>
    </section>

    <section class="border-y border-default bg-elevated">
      <div class="mx-auto grid max-w-[88rem] gap-8 px-6 py-20 lg:grid-cols-12 lg:px-10 lg:py-28">
        <p class="eyebrow lg:col-span-3">
          {{ copy.quizCta.eyebrow }}
        </p>

        <div class="lg:col-span-7">
          <h2 class="max-w-[20ch] font-heading text-[clamp(2.25rem,4.6vw,4rem)] leading-[1.04] text-balance">
            {{ copy.quizCta.title }}
          </h2>
          <p class="mt-6 max-w-[46ch] text-base leading-relaxed text-muted">
            {{ copy.quizCta.body }}
          </p>
          <UButton
            to="/quiz"
            size="xl"
            color="primary"
            trailing-icon="i-lucide-arrow-right"
            :label="copy.quizCta.cta"
            class="mt-9"
          />
        </div>

        <div class="hidden justify-self-end lg:col-span-2 lg:block">
          <span
            class="block font-heading text-[7rem] leading-none text-highlight/30"
            aria-hidden="true"
          >02</span>
        </div>
      </div>
    </section>

    <section class="mx-auto max-w-[88rem] px-6 py-20 lg:px-10 lg:py-28">
      <div class="grid gap-12 lg:grid-cols-12 lg:gap-10">
        <div class="lg:col-span-5">
          <p class="eyebrow">
            {{ copy.collection.eyebrow }}
          </p>
          <h2 class="mt-5 max-w-[16ch] font-heading text-[clamp(2.25rem,4.2vw,3.5rem)] leading-[1.05] text-balance">
            {{ copy.story.title }}
          </h2>
          <p class="mt-6 max-w-[42ch] text-base leading-relaxed text-muted">
            {{ copy.story.body }}
          </p>

          <UButton
            v-if="featured"
            :to="`/product/${featured.slug}`"
            color="neutral"
            variant="link"
            trailing-icon="i-lucide-arrow-right"
            :label="`Discover ${featured.name}`"
            class="mt-6 px-0"
          />
        </div>

        <dl class="divide-y divide-default border-y border-default lg:col-span-6 lg:col-start-7">
          <div
            v-for="(row, index) in noteRows"
            :key="row.label"
            class="grid grid-cols-[5.5rem_1fr] gap-6 py-7 sm:grid-cols-[7rem_1fr]"
          >
            <dt>
              <span
                class="block text-[0.625rem] tabular-nums text-highlight"
                aria-hidden="true"
              >0{{ index + 1 }}</span>
              <span class="mt-1 block text-sm text-default">{{ row.label }}</span>
            </dt>
            <dd class="font-heading text-xl leading-snug text-highlighted sm:text-2xl">
              {{ row.notes.join(', ') }}
            </dd>
          </div>
        </dl>
      </div>
    </section>
  </div>
</template>
