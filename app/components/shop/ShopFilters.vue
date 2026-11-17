<script setup lang="ts">
import type { Occasion, ScentFamily } from '~~/shared/types'
import { OCCASIONS, SCENT_FAMILIES } from '~~/shared/types'
import { PRODUCT_SIZES } from '~~/shared/schemas/product'
import { formatPrice } from '~~/shared/utils/money'
import { intensityLabels, occasionLabels, scentFamilyLabels } from '~~/shared/utils/labels'
import type { ShopFilterState } from '~/composables/useShopFilters'

const props = defineProps<{
  filters: ShopFilterState
  priceRange: { min: number, max: number }
  activeCount: number
}>()

const emit = defineEmits<{
  change: [patch: Partial<ShopFilterState>]
  reset: []
}>()

const priceValues = ref<number[]>([props.priceRange.min, props.priceRange.max])

watch(
  () => [props.filters.priceMin, props.filters.priceMax, props.priceRange.min, props.priceRange.max],
  () => {
    priceValues.value = [
      props.filters.priceMin ?? props.priceRange.min,
      props.filters.priceMax ?? props.priceRange.max
    ]
  },
  { immediate: true }
)

const priceDisabled = computed(() => props.priceRange.max <= props.priceRange.min)
const priceMinLabel = computed(() => formatPrice((priceValues.value[0] ?? props.priceRange.min) * 100))
const priceMaxLabel = computed(() => formatPrice((priceValues.value[1] ?? props.priceRange.max) * 100))

function toggleFamily(family: ScentFamily) {
  const familyList = props.filters.family.includes(family)
    ? props.filters.family.filter(item => item !== family)
    : [...props.filters.family, family]

  emit('change', { family: familyList })
}

function toggleOccasion(occasion: Occasion) {
  const occasionList = props.filters.occasion.includes(occasion)
    ? props.filters.occasion.filter(item => item !== occasion)
    : [...props.filters.occasion, occasion]

  emit('change', { occasion: occasionList })
}

function toggleSize(size: number) {
  emit('change', { size: props.filters.size === size ? null : size })
}

function toggleIntensity(value: number) {
  emit('change', { intensity: props.filters.intensity === value ? null : value })
}

function commitPrice() {
  const [min = props.priceRange.min, max = props.priceRange.max] = priceValues.value
  const isFullRange = min <= props.priceRange.min && max >= props.priceRange.max

  emit('change', {
    priceMin: isFullRange ? null : min,
    priceMax: isFullRange ? null : max
  })
}

const onPriceCommit = useDebounceFn(commitPrice, 250)
</script>

<template>
  <div class="flex flex-col gap-8">
    <div class="flex items-center justify-between gap-4">
      <p class="text-sm text-highlighted">
        Filters
      </p>
      <UButton
        color="neutral"
        variant="link"
        size="xs"
        label="Reset filters"
        :disabled="activeCount === 0"
        @click="emit('reset')"
      />
    </div>

    <fieldset>
      <legend class="eyebrow">
        Scent family
      </legend>
      <div class="mt-3 flex flex-wrap gap-2">
        <button
          v-for="family in SCENT_FAMILIES"
          :key="family"
          type="button"
          :aria-pressed="filters.family.includes(family)"
          class="rounded-full border px-3 py-1.5 text-xs transition-colors"
          :class="filters.family.includes(family)
            ? 'border-primary bg-primary/10 text-highlighted'
            : 'border-default text-muted hover:border-accented hover:text-default'"
          @click="toggleFamily(family)"
        >
          {{ scentFamilyLabels[family] }}
        </button>
      </div>
    </fieldset>

    <fieldset>
      <legend class="eyebrow">
        Occasion
      </legend>
      <div class="mt-3 flex flex-wrap gap-2">
        <button
          v-for="occasion in OCCASIONS"
          :key="occasion"
          type="button"
          :aria-pressed="filters.occasion.includes(occasion)"
          class="rounded-full border px-3 py-1.5 text-xs transition-colors"
          :class="filters.occasion.includes(occasion)
            ? 'border-primary bg-primary/10 text-highlighted'
            : 'border-default text-muted hover:border-accented hover:text-default'"
          @click="toggleOccasion(occasion)"
        >
          {{ occasionLabels[occasion] }}
        </button>
      </div>
    </fieldset>

    <fieldset>
      <legend class="eyebrow">
        Size
      </legend>
      <div class="mt-3 grid grid-cols-3 gap-2">
        <button
          v-for="size in PRODUCT_SIZES"
          :key="size"
          type="button"
          :aria-pressed="filters.size === size"
          class="rounded-theme-sm border px-2 py-2 text-xs transition-colors"
          :class="filters.size === size
            ? 'border-primary bg-primary/10 text-highlighted'
            : 'border-default text-muted hover:border-accented hover:text-default'"
          @click="toggleSize(size)"
        >
          {{ size }} ml
        </button>
      </div>
    </fieldset>

    <fieldset>
      <legend class="eyebrow">
        Intensity
      </legend>
      <div class="mt-3 flex flex-wrap gap-2">
        <button
          v-for="(label, index) in intensityLabels"
          :key="label"
          type="button"
          :aria-pressed="filters.intensity === index + 1"
          class="rounded-full border px-3 py-1.5 text-xs transition-colors"
          :class="filters.intensity === index + 1
            ? 'border-primary bg-primary/10 text-highlighted'
            : 'border-default text-muted hover:border-accented hover:text-default'"
          @click="toggleIntensity(index + 1)"
        >
          {{ label }}
        </button>
      </div>
    </fieldset>

    <fieldset>
      <legend class="eyebrow">
        Price
      </legend>
      <div class="mt-4">
        <USlider
          v-model="priceValues"
          :min="priceRange.min"
          :max="priceRange.max"
          :step="1"
          :min-steps-between-thumbs="1"
          :disabled="priceDisabled"
          aria-label="Price range"
          @change="onPriceCommit"
        />
        <div class="mt-3 flex items-center justify-between text-xs text-muted">
          <span>{{ priceMinLabel }}</span>
          <span>{{ priceMaxLabel }}</span>
        </div>
      </div>
    </fieldset>
  </div>
</template>
