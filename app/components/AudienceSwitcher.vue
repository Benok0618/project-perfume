<script setup lang="ts">
import type { Audience } from '~~/shared/types'
import { audienceOptions } from '~/config/themes'
import { useAudienceStore } from '~/stores/audience'

const props = withDefaults(defineProps<{ size?: 'sm' | 'lg' }>(), { size: 'sm' })

const audienceStore = useAudienceStore()
const route = useRoute()
const router = useRouter()

type ThemeTransitionDocument = Document & {
  startViewTransition?: (callback: () => void | Promise<void>) => { ready: Promise<void> }
}

function apply(id: Audience) {
  audienceStore.setAudience(id)
  router.replace({ query: { ...route.query, audience: id } })
}

function select(id: Audience, event: MouseEvent) {
  if (audienceStore.audience === id) return

  const transitionDocument = document as ThemeTransitionDocument

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !transitionDocument.startViewTransition) {
    apply(id)
    return
  }

  const target = event.currentTarget as HTMLElement | null
  const rect = target?.getBoundingClientRect()
  const x = rect ? rect.left + rect.width / 2 : window.innerWidth / 2
  const y = rect ? rect.top + rect.height / 2 : window.innerHeight / 2
  const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y))

  const transition = transitionDocument.startViewTransition(async () => {
    apply(id)
    await nextTick()
  })

  transition.ready.then(() => {
    const styles = getComputedStyle(document.documentElement)
    const duration = Number.parseFloat(styles.getPropertyValue('--theme-duration')) || 600
    const easing = styles.getPropertyValue('--theme-ease').trim() || 'ease'

    document.documentElement.animate(
      { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
      { duration, easing, pseudoElement: '::view-transition-new(root)' }
    )
  }).catch(() => {})
}
</script>

<template>
  <div
    role="group"
    aria-label="Audience theme"
    class="inline-flex items-center gap-1 rounded-full border border-default bg-elevated/60 p-1"
  >
    <button
      v-for="option in audienceOptions"
      :key="option.id"
      type="button"
      :aria-pressed="audienceStore.audience === option.id"
      class="rounded-full uppercase tracking-[0.18em] transition-colors"
      :class="[
        props.size === 'lg' ? 'px-4 py-2 text-xs' : 'px-3 py-1.5 text-[0.6875rem]',
        audienceStore.audience === option.id ? 'bg-primary text-inverted' : 'text-muted hover:text-default'
      ]"
      @click="select(option.id, $event)"
    >
      {{ option.label }}
    </button>
  </div>
</template>
