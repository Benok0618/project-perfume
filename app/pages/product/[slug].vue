<script setup lang="ts">
import type { Product } from '~~/shared/types'

const route = useRoute()

const slug = computed(() => {
  const value = route.params.slug
  return Array.isArray(value) ? value[0] ?? '' : value ?? ''
})

const { data: product, error } = await useFetch<Product>(() => `/api/products/${slug.value}`)

if (error.value || !product.value) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Product not found',
    fatal: true
  })
}

const current = computed(() => product.value as Product)
const image = computed(() => current.value.images[0] ?? '')
const siteUrl = useSiteUrl()

useSeoMeta({
  title: current.value.name,
  description: current.value.description,
  ogTitle: current.value.name,
  ogDescription: current.value.description,
  ogImage: `${siteUrl.value}${image.value}`,
  ogUrl: `${siteUrl.value}/product/${current.value.slug}`,
  twitterCard: 'summary_large_image'
})

useHead({
  link: [
    { rel: 'canonical', href: `${siteUrl.value}/product/${current.value.slug}` }
  ]
})
</script>

<template>
  <div>
    <nav
      aria-label="Breadcrumb"
      class="mx-auto max-w-[88rem] px-6 pt-8 lg:px-10"
    >
      <ol class="flex flex-wrap items-center gap-2 text-xs text-muted">
        <li>
          <NuxtLink
            to="/"
            class="transition-colors hover:text-default"
          >
            Home
          </NuxtLink>
        </li>
        <li aria-hidden="true">
          /
        </li>
        <li>
          <NuxtLink
            to="/shop"
            class="transition-colors hover:text-default"
          >
            Shop
          </NuxtLink>
        </li>
        <li aria-hidden="true">
          /
        </li>
        <li>
          <span
            aria-current="page"
            class="text-default"
          >
            {{ current.name }}
          </span>
        </li>
      </ol>
    </nav>

    <section class="mx-auto max-w-[88rem] px-6 pb-16 pt-8 lg:px-10 lg:pb-24">
      <div class="overflow-hidden rounded-theme border border-default">
        <ProductDetail
          :product="current"
          heading-tag="h1"
        />
      </div>

      <div class="mt-8">
        <UButton
          to="/shop"
          color="neutral"
          variant="link"
          icon="i-lucide-arrow-left"
          label="Back to shop"
          class="px-0"
        />
      </div>
    </section>
  </div>
</template>
