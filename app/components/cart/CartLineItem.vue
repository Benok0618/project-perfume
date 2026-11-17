<script setup lang="ts">
import type { CartLine } from '~~/shared/types'
import { formatPrice } from '~~/shared/utils/money'

const props = withDefaults(defineProps<{
  line: CartLine
  disabled?: boolean
}>(), {
  disabled: false
})

const emit = defineEmits<{
  'update:quantity': [value: number]
  'update:size': [value: number]
  'remove': []
}>()

const sizeItems = computed(() => props.line.sizes
  .filter(size => size.stock > 0 || size.sizeMl === props.line.sizeMl)
  .map(size => ({
    label: `${size.sizeMl} ml · ${formatPrice(size.priceCents)}`,
    value: size.sizeMl
  })))

function onSizeChange(value: unknown) {
  const next = Number(value)
  if (Number.isFinite(next) && next !== props.line.sizeMl) emit('update:size', next)
}
</script>

<template>
  <div class="flex gap-4">
    <div class="shrink-0 overflow-hidden rounded-theme-sm border border-default bg-muted">
      <img
        :src="line.image"
        :alt="line.name"
        width="160"
        height="200"
        loading="lazy"
        decoding="async"
        class="product-art aspect-[4/5] w-16 object-cover sm:w-20"
      >
    </div>

    <div class="min-w-0 flex-1">
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0">
          <NuxtLink
            :to="`/product/${line.slug}`"
            class="block truncate text-sm font-medium text-highlighted transition-colors hover:text-primary"
          >
            {{ line.name }}
          </NuxtLink>
          <p class="mt-0.5 text-xs text-muted">
            {{ formatPrice(line.unitPriceCents) }} each
          </p>
        </div>
        <p class="shrink-0 text-sm text-default">
          {{ formatPrice(line.lineTotalCents) }}
        </p>
      </div>

      <div class="mt-3 flex flex-wrap items-center gap-2">
        <USelect
          :model-value="line.sizeMl"
          :items="sizeItems"
          size="xs"
          :disabled="disabled"
          :aria-label="`Size for ${line.name}`"
          class="w-36"
          @update:model-value="onSizeChange"
        />

        <div
          role="group"
          :aria-label="`Quantity for ${line.name}`"
          class="flex items-center gap-1 rounded-theme-sm border border-default p-0.5"
        >
          <UButton
            icon="i-lucide-minus"
            color="neutral"
            variant="ghost"
            size="xs"
            aria-label="Decrease quantity"
            :disabled="disabled || line.quantity <= 1"
            @click="emit('update:quantity', line.quantity - 1)"
          />
          <span
            class="w-6 text-center text-sm text-default"
            aria-live="polite"
          >
            {{ line.quantity }}
          </span>
          <UButton
            icon="i-lucide-plus"
            color="neutral"
            variant="ghost"
            size="xs"
            aria-label="Increase quantity"
            :disabled="disabled || line.quantity >= line.stock"
            @click="emit('update:quantity', line.quantity + 1)"
          />
        </div>

        <UButton
          icon="i-lucide-trash-2"
          color="neutral"
          variant="ghost"
          size="xs"
          :aria-label="`Remove ${line.name} from bag`"
          :disabled="disabled"
          class="ms-auto"
          @click="emit('remove')"
        />
      </div>

      <p
        v-if="line.stock <= 5"
        class="mt-2 text-[0.6875rem] uppercase tracking-[0.14em] text-muted"
      >
        Only {{ line.stock }} left
      </p>
    </div>
  </div>
</template>
