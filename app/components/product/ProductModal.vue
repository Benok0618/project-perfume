<script setup lang="ts">
import type { Product } from '~~/shared/types'

const props = defineProps<{
  open: boolean
  product: Product | null
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

const { $gsap } = useNuxtApp()
const cart = useCartStore()

const scrollRef = ref<HTMLElement | null>(null)
const pendingDrawer = ref(false)
let revealContext: ReturnType<typeof $gsap.context> | null = null
let lastFocused: HTMLElement | null = null

const title = computed(() => props.product?.name ?? 'Product')
const description = computed(() => props.product?.tagline ?? 'Product details')

function clearReveal() {
  revealContext?.revert()
  revealContext = null
}

function reveal() {
  if (!import.meta.client || !scrollRef.value) return

  clearReveal()

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  const targets = scrollRef.value.querySelectorAll('[data-modal-reveal]')

  revealContext = $gsap.context(() => {
    $gsap.from(targets, {
      opacity: 0,
      y: 22,
      duration: 0.55,
      stagger: 0.055,
      ease: 'power3.out',
      clearProps: 'opacity,transform'
    })
  }, scrollRef.value)
}

function close() {
  emit('update:open', false)
}

function restoreFocus() {
  lastFocused?.focus()
  lastFocused = null
}

function onAdded() {
  pendingDrawer.value = true
  emit('update:open', false)
}

function afterLeave() {
  restoreFocus()

  if (pendingDrawer.value) {
    pendingDrawer.value = false
    cart.openDrawer()
  }
}

watch(() => props.open, (open) => {
  if (open) {
    lastFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null
    nextTick(reveal)
  }
}, { flush: 'pre' })

onMounted(() => {
  if (props.open) nextTick(reveal)
})

onBeforeUnmount(clearReveal)
</script>

<template>
  <UModal
    :open="open"
    :title="title"
    :description="description"
    :close="false"
    :ui="{ content: 'max-w-5xl p-0', overlay: 'bg-default/80 backdrop-blur-sm' }"
    @update:open="emit('update:open', $event)"
    @enter="reveal"
    @after:leave="afterLeave"
  >
    <template #content>
      <div class="relative">
        <UButton
          icon="i-lucide-x"
          color="neutral"
          variant="solid"
          size="sm"
          aria-label="Close product details"
          class="absolute end-4 top-4 z-20 rounded-full shadow-theme"
          @click="close"
        />

        <div
          ref="scrollRef"
          class="max-h-[calc(100dvh-2rem)] overflow-y-auto overscroll-contain sm:max-h-[calc(100dvh-4rem)]"
        >
          <ProductDetail
            v-if="product"
            :product="product"
            defer-drawer
            @added="onAdded"
          />
        </div>
      </div>
    </template>
  </UModal>
</template>
