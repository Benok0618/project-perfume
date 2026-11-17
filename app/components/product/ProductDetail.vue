<script setup lang="ts">
import type { Product } from '~~/shared/types'
import { formatPrice } from '~~/shared/utils/money'
import { audienceLabels, intensityLabels, occasionLabels, scentFamilyLabels } from '~~/shared/utils/labels'

const props = withDefaults(defineProps<{
  product: Product
  headingTag?: 'h1' | 'h2'
  deferDrawer?: boolean
}>(), {
  headingTag: 'h2',
  deferDrawer: false
})

const emit = defineEmits<{
  added: []
}>()

const cart = useCartStore()
const { $gsap } = useNuxtApp()

const selectedSize = ref(0)
const quantity = ref(1)
const activeImage = ref(0)
const adding = ref(false)
const addError = ref<string | null>(null)
const addButtonRef = ref<HTMLElement | null>(null)

const currentSize = computed(() => props.product.sizes.find(size => size.sizeMl === selectedSize.value) ?? props.product.sizes[0])
const stock = computed(() => currentSize.value?.stock ?? 0)
const price = computed(() => currentSize.value?.priceCents ?? 0)
const inStock = computed(() => stock.value > 0)
const maxQuantity = computed(() => Math.max(1, stock.value))
const activeImageSrc = computed(() => props.product.images[activeImage.value] ?? props.product.images[0] ?? '')
const intensityLabel = computed(() => intensityLabels[props.product.intensity - 1] ?? 'Balanced')
const noteGroups = computed(() => [
  { label: 'Top notes', notes: props.product.topNotes },
  { label: 'Heart notes', notes: props.product.heartNotes },
  { label: 'Base notes', notes: props.product.baseNotes }
])

function resetSelection() {
  selectedSize.value = props.product.sizes.find(size => size.stock > 0)?.sizeMl ?? props.product.sizes[0]?.sizeMl ?? 0
  quantity.value = 1
  activeImage.value = 0
}

function setQuantity(value: number) {
  if (!Number.isFinite(value)) return
  quantity.value = Math.min(maxQuantity.value, Math.max(1, Math.round(value)))
}

function onQuantityInput(event: Event) {
  setQuantity(Number((event.target as HTMLInputElement).value))
}

function pulseAddButton() {
  if (!import.meta.client || !addButtonRef.value) return
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  $gsap.fromTo(addButtonRef.value, { scale: 1 }, {
    scale: 0.97,
    duration: 0.14,
    yoyo: true,
    repeat: 1,
    ease: 'power2.out',
    clearProps: 'transform'
  })
}

async function addToBag() {
  if (!inStock.value || adding.value) return

  adding.value = true
  addError.value = null

  const added = await cart.add({
    productId: props.product.id,
    sizeMl: selectedSize.value,
    quantity: quantity.value
  }, { openDrawer: !props.deferDrawer })

  adding.value = false

  if (!added) {
    addError.value = cart.error ?? 'Your bag could not be updated. Please try again.'
    return
  }

  pulseAddButton()
  emit('added')
}

watch(() => props.product.slug, resetSelection, { immediate: true })
watch(maxQuantity, (max) => {
  if (quantity.value > max) quantity.value = max
})
</script>

<template>
  <div class="grid lg:grid-cols-2">
    <div
      class="bg-muted/60 p-5 sm:p-8 lg:p-10"
      data-modal-reveal
    >
      <div class="flex flex-col gap-4">
        <div class="overflow-hidden rounded-theme border border-default bg-muted">
          <img
            :src="activeImageSrc"
            :alt="`${product.name}, view ${activeImage + 1}`"
            width="800"
            height="1000"
            decoding="async"
            class="product-art aspect-[4/5] w-full object-cover"
          >
        </div>

        <div
          v-if="product.images.length > 1"
          class="grid grid-cols-3 gap-3"
        >
          <button
            v-for="(image, index) in product.images"
            :key="image"
            type="button"
            :aria-label="`Show image ${index + 1}`"
            :aria-pressed="activeImage === index"
            class="overflow-hidden rounded-theme-sm border p-0.5 transition-colors"
            :class="activeImage === index ? 'border-primary' : 'border-transparent hover:border-accented'"
            @click="activeImage = index"
          >
            <img
              :src="image"
              alt=""
              width="800"
              height="800"
              loading="lazy"
              decoding="async"
              class="product-art aspect-square w-full object-cover"
            >
          </button>
        </div>
      </div>
    </div>

    <div class="flex flex-col gap-6 p-5 sm:p-8 lg:p-10">
      <div data-modal-reveal>
        <p class="eyebrow">
          {{ audienceLabels[product.audience] }}
        </p>
        <div class="mt-3 flex flex-wrap items-center gap-3">
          <component
            :is="headingTag"
            class="font-heading text-3xl leading-tight text-highlighted sm:text-4xl"
          >
            {{ product.name }}
          </component>
          <UBadge
            color="neutral"
            variant="subtle"
            size="sm"
          >
            <span
              aria-hidden="true"
              class="me-1.5 inline-block size-1.5 rounded-full bg-warm"
            />
            {{ scentFamilyLabels[product.scentFamily] }}
          </UBadge>
        </div>
        <p class="mt-3 text-sm leading-relaxed text-muted">
          {{ product.tagline }}
        </p>
      </div>

      <div
        class="flex items-end justify-between gap-4 border-y border-default py-4"
        data-modal-reveal
      >
        <p class="font-heading text-2xl text-highlighted">
          {{ formatPrice(price) }}
        </p>
        <p class="text-xs uppercase tracking-[0.16em] text-muted">
          <template v-if="!inStock">
            Sold out
          </template>
          <template v-else-if="stock <= 10">
            Only {{ stock }} left
          </template>
          <template v-else>
            In stock
          </template>
        </p>
      </div>

      <div data-modal-reveal>
        <p class="eyebrow">
          Size
        </p>
        <div class="mt-3 grid grid-cols-3 gap-2">
          <button
            v-for="size in product.sizes"
            :key="size.sizeMl"
            type="button"
            :aria-pressed="selectedSize === size.sizeMl"
            :disabled="size.stock === 0"
            class="rounded-theme-sm border px-3 py-2.5 text-start transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            :class="selectedSize === size.sizeMl ? 'border-primary bg-primary/10 text-highlighted' : 'border-default text-muted hover:border-accented hover:text-default'"
            @click="selectedSize = size.sizeMl"
          >
            <span class="block text-sm">{{ size.sizeMl }} ml</span>
            <span class="mt-0.5 block text-xs">{{ formatPrice(size.priceCents) }}</span>
            <span
              v-if="size.stock === 0"
              class="mt-0.5 block text-[0.625rem] uppercase tracking-[0.14em]"
            >
              Sold out
            </span>
          </button>
        </div>
      </div>

      <div data-modal-reveal>
        <p class="eyebrow">
          Notes
        </p>
        <dl class="mt-3 space-y-3">
          <div
            v-for="group in noteGroups"
            :key="group.label"
            class="grid gap-1 sm:grid-cols-[6.5rem_1fr] sm:gap-3"
          >
            <dt class="text-xs uppercase tracking-[0.14em] text-muted sm:pt-1">
              {{ group.label }}
            </dt>
            <dd class="flex flex-wrap gap-1.5">
              <span
                v-for="note in group.notes"
                :key="note"
                class="rounded-full border border-default px-2.5 py-1 text-xs text-muted"
              >
                {{ note }}
              </span>
            </dd>
          </div>
        </dl>
      </div>

      <p
        class="text-sm leading-relaxed text-muted"
        data-modal-reveal
      >
        {{ product.description }}
      </p>

      <div
        class="flex flex-col gap-3"
        data-modal-reveal
      >
        <div class="flex items-center gap-3">
          <span class="eyebrow">Intensity</span>
          <div
            role="img"
            :aria-label="`Intensity ${product.intensity} out of 5, ${intensityLabel}`"
            class="flex gap-1"
          >
            <span
              v-for="step in 5"
              :key="step"
              class="h-1 w-6 rounded-full"
              :class="step <= product.intensity ? 'bg-primary' : 'bg-elevated'"
            />
          </div>
          <span class="text-xs text-muted">{{ intensityLabel }}</span>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <span class="eyebrow">Occasion</span>
          <span
            v-for="occasion in product.occasions"
            :key="occasion"
            class="rounded-full border border-default px-2.5 py-1 text-xs text-muted"
          >
            {{ occasionLabels[occasion] }}
          </span>
        </div>
      </div>

      <div
        class="flex items-center justify-between gap-4"
        data-modal-reveal
      >
        <label
          for="product-quantity"
          class="text-sm text-muted"
        >
          Quantity
        </label>
        <div class="flex items-center gap-1 rounded-theme-sm border border-default p-1">
          <UButton
            icon="i-lucide-minus"
            color="neutral"
            variant="ghost"
            size="xs"
            aria-label="Decrease quantity"
            :disabled="quantity <= 1"
            @click="setQuantity(quantity - 1)"
          />
          <input
            id="product-quantity"
            :value="quantity"
            type="number"
            inputmode="numeric"
            min="1"
            :max="maxQuantity"
            class="w-9 bg-transparent text-center text-sm text-default focus-visible:outline-none"
            @input="onQuantityInput"
          >
          <UButton
            icon="i-lucide-plus"
            color="neutral"
            variant="ghost"
            size="xs"
            aria-label="Increase quantity"
            :disabled="quantity >= maxQuantity"
            @click="setQuantity(quantity + 1)"
          />
        </div>
      </div>

      <div
        ref="addButtonRef"
        class="space-y-3"
        data-modal-reveal
      >
        <UAlert
          v-if="addError"
          color="error"
          variant="subtle"
          :title="addError"
          role="alert"
        />

        <UButton
          block
          size="xl"
          color="primary"
          :disabled="!inStock || adding"
          :loading="adding"
          @click="addToBag"
        >
          Add to bag
        </UButton>
      </div>
    </div>
  </div>
</template>
