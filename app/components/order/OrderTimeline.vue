<script setup lang="ts">
import type { OrderStatus, OrderStatusEvent } from '~~/shared/types'
import { ORDER_STATUSES } from '~~/shared/types'
import { formatOrderDate } from '~~/shared/utils/date'
import { orderStatusLabels } from '~~/shared/utils/labels'

const props = defineProps<{
  status: OrderStatus
  events: OrderStatusEvent[]
}>()

const { $gsap } = useNuxtApp()

const currentIndex = computed(() => ORDER_STATUSES.indexOf(props.status))
const progress = computed(() => currentIndex.value <= 0 ? 0 : currentIndex.value / (ORDER_STATUSES.length - 1))

const steps = computed(() => ORDER_STATUSES.map((status, index) => {
  const event = props.events.find(entry => entry.status === status)

  return {
    status,
    label: orderStatusLabels[status],
    date: event?.createdAt ?? null,
    done: index < currentIndex.value,
    current: index === currentIndex.value
  }
}))

const lineRef = ref<HTMLElement | null>(null)
let context: ReturnType<typeof $gsap.context> | null = null

onMounted(() => {
  if (!import.meta.client || !lineRef.value) return
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  context = $gsap.context(() => {
    $gsap.fromTo(lineRef.value, { scaleY: 0 }, {
      scaleY: 1,
      duration: 0.9,
      ease: 'power2.out',
      clearProps: 'transform'
    })
  })
})

onBeforeUnmount(() => {
  context?.revert()
  context = null
})
</script>

<template>
  <div class="relative mt-6">
    <div
      aria-hidden="true"
      class="absolute inset-y-3 start-[0.6875rem] w-px bg-[var(--theme-border)]"
    />
    <div
      aria-hidden="true"
      class="absolute inset-y-3 start-[0.6875rem] w-px overflow-hidden"
    >
      <span
        ref="lineRef"
        class="block w-px origin-top bg-primary"
        :style="{ height: `${progress * 100}%` }"
      />
    </div>

    <ol class="relative space-y-6">
      <li
        v-for="step in steps"
        :key="step.status"
        class="flex gap-4"
        :aria-current="step.current ? 'step' : undefined"
      >
        <span
          class="relative z-10 flex size-6 shrink-0 items-center justify-center rounded-full border bg-default"
          :class="step.done || step.current ? 'border-primary text-primary' : 'border-default text-muted'"
        >
          <UIcon
            v-if="step.done"
            name="i-lucide-check"
            class="size-3.5"
          />
          <span
            v-else
            class="size-1.5 rounded-full"
            :class="step.current ? 'bg-primary' : 'bg-[var(--theme-border-strong)]'"
          />
        </span>

        <div class="min-w-0">
          <p
            class="text-sm"
            :class="step.current ? 'text-highlighted' : step.done ? 'text-default' : 'text-muted'"
          >
            {{ step.label }}
            <span class="sr-only">{{ step.done ? '(completed)' : step.current ? '(current status)' : '(pending)' }}</span>
          </p>
          <p class="mt-0.5 text-xs text-muted">
            {{ step.date ? formatOrderDate(step.date, true) : 'Pending' }}
          </p>
        </div>
      </li>
    </ol>
  </div>
</template>
