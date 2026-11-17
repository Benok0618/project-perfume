<script setup lang="ts">
import type { Product } from '~~/shared/types'
import type { ProductListResponse, ProductSort } from '~~/shared/schemas/product'
import type { ShopFilterState } from '~/composables/useShopFilters'
import { copy } from '~/content/copy'
import { formatPrice } from '~~/shared/utils/money'
import { intensityLabels, occasionLabels, scentFamilyLabels } from '~~/shared/utils/labels'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const { filters, apiQuery, activeFilterCount, update, reset } = useShopFilters()

const { data, status, error, refresh } = await useFetch<ProductListResponse>('/api/products', {
  key: 'shop-products',
  query: apiQuery
})

const products = computed(() => data.value?.products ?? [])
const total = computed(() => data.value?.total ?? 0)
const pending = computed(() => status.value === 'pending')
const priceRange = computed(() => data.value?.priceRange ?? { min: 0, max: 0 })
const showSkeleton = computed(() => pending.value && !data.value)

const searchInput = ref(filters.value.q)
const filtersOpen = ref(false)

watch(() => filters.value.q, (q) => {
  if (q !== searchInput.value) searchInput.value = q
})

const applySearch = useDebounceFn(() => {
  const q = searchInput.value.trim()
  if (q === filters.value.q) return

  update({ q }, { replace: true })
}, 320)

watch(searchInput, applySearch)

const sortOptions = [
  { label: 'Featured', value: 'featured' },
  { label: 'Price: low to high', value: 'price-asc' },
  { label: 'Price: high to low', value: 'price-desc' },
  { label: 'Newest', value: 'newest' }
]

function onSort(value: unknown) {
  update({ sort: value as ProductSort })
}

function onFilterChange(patch: Partial<ShopFilterState>) {
  update(patch)
}

function onReset() {
  reset()
}

interface ActiveChip {
  key: string
  label: string
  clear: () => void
}

const activeChips = computed<ActiveChip[]>(() => {
  const state = filters.value
  const chips: ActiveChip[] = []

  if (state.q) {
    chips.push({ key: 'q', label: `Search: ${state.q}`, clear: () => update({ q: '' }) })
  }

  for (const family of state.family) {
    chips.push({
      key: `family-${family}`,
      label: scentFamilyLabels[family],
      clear: () => update({ family: state.family.filter(item => item !== family) })
    })
  }

  for (const occasion of state.occasion) {
    chips.push({
      key: `occasion-${occasion}`,
      label: occasionLabels[occasion],
      clear: () => update({ occasion: state.occasion.filter(item => item !== occasion) })
    })
  }

  if (state.size !== null) {
    chips.push({ key: 'size', label: `${state.size} ml`, clear: () => update({ size: null }) })
  }

  if (state.intensity !== null) {
    chips.push({
      key: 'intensity',
      label: intensityLabels[state.intensity - 1] ?? `Intensity ${state.intensity}`,
      clear: () => update({ intensity: null })
    })
  }

  if (state.priceMin !== null || state.priceMax !== null) {
    const min = formatPrice((state.priceMin ?? priceRange.value.min) * 100)
    const max = formatPrice((state.priceMax ?? priceRange.value.max) * 100)

    chips.push({
      key: 'price',
      label: `${min} – ${max}`,
      clear: () => update({ priceMin: null, priceMax: null })
    })
  }

  return chips
})

const productSlug = computed(() => {
  const value = route.query.product
  if (Array.isArray(value)) return value[0]
  return typeof value === 'string' ? value : undefined
})

const { data: fetchedModalProduct, status: modalStatus } = await useAsyncData<Product | null>(
  'shop-modal-product',
  async () => {
    const slug = productSlug.value
    if (!slug) return null

    try {
      return await $fetch<Product>(`/api/products/${slug}`)
    } catch {
      return null
    }
  },
  { watch: [productSlug], default: () => null }
)

const selectedProduct = computed<Product | null>(() => {
  const slug = productSlug.value
  if (!slug) return null
  if (fetchedModalProduct.value?.slug === slug) return fetchedModalProduct.value

  return products.value.find(product => product.slug === slug) ?? null
})

const modalOpen = computed(() => !!productSlug.value && !!selectedProduct.value)

function closeProduct() {
  const query = { ...route.query }
  delete query.product
  router.replace({ query })
}

function onModalOpenChange(open: boolean) {
  if (!open) closeProduct()
}

function validateModal() {
  if (!import.meta.client) return
  if (!productSlug.value) return
  if (modalStatus.value === 'pending') return
  if (selectedProduct.value) return

  toast.add({
    title: 'Product not found',
    description: 'That product is no longer available.',
    color: 'error'
  })

  closeProduct()
}

onMounted(validateModal)
watch([productSlug, modalStatus], validateModal)

useSeoMeta({
  title: 'Shop',
  description: copy.shop.body,
  ogTitle: 'Shop',
  ogDescription: copy.shop.body
})
</script>

<template>
  <div>
    <section class="border-b border-default">
      <div class="mx-auto max-w-[88rem] px-6 pb-12 pt-14 lg:px-10 lg:pb-16 lg:pt-20">
        <div class="grid gap-8 lg:grid-cols-12 lg:items-end lg:gap-10">
          <div class="lg:col-span-7">
            <p class="eyebrow">
              {{ copy.shop.eyebrow }}
            </p>
            <h1 class="mt-5 max-w-[20ch] font-heading text-[clamp(2.25rem,4.6vw,3.75rem)] leading-[1.05] text-balance text-highlighted">
              {{ copy.shop.title }}
            </h1>
          </div>

          <div class="lg:col-span-5">
            <p class="max-w-[44ch] text-sm leading-relaxed text-muted">
              {{ copy.shop.body }}
            </p>

            <div class="mt-6">
              <p class="text-sm text-default">
                Shop for
              </p>
              <div class="mt-3">
                <AudienceSwitcher size="lg" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="mx-auto max-w-[88rem] px-6 py-10 lg:px-10 lg:py-14">
      <div class="flex flex-col gap-8 lg:flex-row lg:gap-12">
        <aside class="hidden w-64 shrink-0 self-start lg:sticky lg:top-[calc(var(--ui-header-height)+2rem)] lg:block">
          <ShopFilters
            :filters="filters"
            :price-range="priceRange"
            :active-count="activeFilterCount"
            @change="onFilterChange"
            @reset="onReset"
          />
        </aside>

        <div class="min-w-0 flex-1">
          <div class="flex flex-wrap items-center gap-x-4 gap-y-3 border-b border-default pb-5">
            <div class="w-full sm:w-64">
              <UInput
                v-model="searchInput"
                icon="i-lucide-search"
                type="search"
                size="md"
                aria-label="Search products"
                placeholder="Search by name or notes"
                class="w-full"
              />
            </div>

            <p
              class="text-sm text-muted"
              aria-live="polite"
              aria-atomic="true"
            >
              {{ total }} {{ total === 1 ? 'product' : 'products' }}
            </p>

            <div class="ms-auto flex items-center gap-2">
              <UButton
                color="neutral"
                variant="outline"
                icon="i-lucide-sliders-horizontal"
                :label="activeFilterCount ? `Filters (${activeFilterCount})` : 'Filters'"
                class="lg:hidden"
                @click="filtersOpen = true"
              />

              <USelect
                :model-value="filters.sort"
                :items="sortOptions"
                aria-label="Sort products"
                class="w-44"
                @update:model-value="onSort"
              />
            </div>
          </div>

          <div
            v-if="activeChips.length"
            class="mt-4 flex flex-wrap items-center gap-2"
          >
            <span class="eyebrow me-1">Active filters</span>
            <button
              v-for="chip in activeChips"
              :key="chip.key"
              type="button"
              class="inline-flex max-w-full items-center gap-1.5 rounded-full border border-default px-3 py-1.5 text-xs text-muted transition-colors hover:border-accented hover:text-default"
              :aria-label="`Remove ${chip.label} filter`"
              @click="chip.clear"
            >
              <span class="truncate">{{ chip.label }}</span>
              <UIcon
                name="i-lucide-x"
                class="size-3.5 shrink-0"
              />
            </button>
            <UButton
              v-if="activeChips.length > 1"
              color="neutral"
              variant="link"
              size="xs"
              label="Clear all"
              @click="onReset"
            />
          </div>

          <UAlert
            v-if="error"
            color="error"
            variant="subtle"
            class="mt-8"
            title="Could not load products"
            description="Check your connection and try again."
            :actions="[{ label: 'Retry', onClick: () => refresh() }]"
          />

          <ul
            v-if="showSkeleton"
            class="mt-8 grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-3"
            aria-hidden="true"
          >
            <li
              v-for="placeholder in 6"
              :key="placeholder"
            >
              <USkeleton class="aspect-[4/5] w-full rounded-theme" />
              <USkeleton class="mt-4 h-4 w-2/3" />
              <USkeleton class="mt-2 h-3 w-1/2" />
            </li>
          </ul>

          <UEmpty
            v-else-if="!products.length && !error"
            class="mt-16"
            icon="i-lucide-search-x"
            :title="copy.shop.emptyTitle"
            :description="copy.shop.emptyBody"
            :actions="[
              { label: 'Reset filters', onClick: onReset },
              { label: 'Find your scent', color: 'neutral', variant: 'outline', onClick: () => navigateTo('/quiz') }
            ]"
          />

          <TransitionGroup
            v-else-if="products.length"
            tag="ul"
            name="card"
            class="mt-8 grid grid-cols-2 gap-x-5 gap-y-10 transition-opacity duration-300 lg:grid-cols-3"
            :class="{ 'opacity-60': pending }"
            :aria-busy="pending"
          >
            <ProductCard
              v-for="(product, index) in products"
              :key="product.slug"
              :product="product"
              :index="index"
            />
          </TransitionGroup>
        </div>
      </div>
    </section>

    <USlideover
      v-model:open="filtersOpen"
      title="Filters"
      :ui="{ content: 'max-w-sm' }"
    >
      <template #body>
        <ShopFilters
          :filters="filters"
          :price-range="priceRange"
          :active-count="activeFilterCount"
          @change="onFilterChange"
          @reset="onReset"
        />
      </template>

      <template #footer>
        <UButton
          block
          color="primary"
          label="Show results"
          @click="filtersOpen = false"
        />
      </template>
    </USlideover>

    <ProductModal
      :open="modalOpen"
      :product="selectedProduct"
      @update:open="onModalOpenChange"
    />
  </div>
</template>

<style scoped>
.card-move {
  transition: transform 420ms var(--theme-ease);
}

.card-leave-active {
  animation: none;
  transition: opacity 180ms ease;
}

.card-leave-to {
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .card-move,
  .card-leave-active {
    transition: none;
  }
}
</style>
