<script setup lang="ts">
import type { Product } from '~~/shared/types'
import { getAudienceOption } from '~/config/themes'
import { copy } from '~/content/copy'
import { useAudienceStore } from '~/stores/audience'
import { formatPrice } from '~~/shared/utils/money'
import { intensityLabels, scentFamilyLabels } from '~~/shared/utils/labels'

const props = defineProps<{
  product: Product | null
}>()

const { $gsap } = useNuxtApp()
const cart = useCartStore()
const { audience } = storeToRefs(useAudienceStore())
const { overHero } = useHeroChrome()

const root = ref<HTMLElement | null>(null)
const stage = ref<HTMLElement | null>(null)
const intro = ref<HTMLElement | null>(null)
const stageOne = ref<HTMLElement | null>(null)
const stageTwo = ref<HTMLElement | null>(null)
const reveal = ref<HTMLElement | null>(null)
const video = ref<HTMLVideoElement | null>(null)

const progress = ref(0)
const scrubEnabled = ref(false)
const staticFallback = ref(false)
const loadVideo = ref(false)
const videoReady = ref(false)
const adding = ref(false)

const media = computed(() => getAudienceOption(audience.value).hero)
const motion = computed(() => getAudienceOption(audience.value).motion)

const selectedSize = computed(() => {
  const sizes = props.product?.sizes ?? []
  return sizes.find(size => size.sizeMl === 50 && size.stock > 0)
    ?? sizes.find(size => size.stock > 0)
    ?? null
})

const familyLabel = computed(() => props.product ? scentFamilyLabels[props.product.scentFamily] : '—')
const intensityLabel = computed(() => props.product ? intensityLabels[props.product.intensity - 1] ?? `Level ${props.product.intensity}` : '—')
const priceLabel = computed(() => selectedSize.value
  ? `${formatPrice(selectedSize.value.priceCents)} · ${selectedSize.value.sizeMl} ml`
  : '')
const stockLine = computed(() => selectedSize.value
  ? `${selectedSize.value.stock} remaining`
  : 'Currently unavailable')

let heroContext: ReturnType<typeof $gsap.context> | null = null
let mediaQueries: ReturnType<typeof $gsap.matchMedia> | null = null
let quickSeek: ((value: number) => void) | null = null
let duration = 0
let latestProgress = 0
let scrollFrame = 0

async function addToBag() {
  if (!props.product || !selectedSize.value || adding.value) return

  adding.value = true
  await cart.add({
    productId: props.product.id,
    sizeMl: selectedSize.value.sizeMl,
    quantity: 1
  })
  adding.value = false
}

function seekToProgress(value: number) {
  latestProgress = value
  progress.value = Math.round(value * 100)

  if (quickSeek && duration > 0) quickSeek(value * duration)
}

function syncChrome() {
  if (!root.value) return
  overHero.value = root.value.getBoundingClientRect().bottom > 1
}

function onScroll() {
  if (scrollFrame) return
  scrollFrame = requestAnimationFrame(() => {
    scrollFrame = 0
    syncChrome()
  })
}

function onVideoMetadata() {
  const element = video.value
  if (!element || !scrubEnabled.value) return

  duration = element.duration
  if (!Number.isFinite(duration) || duration <= 0) return

  element.pause()
  element.currentTime = 0.001

  const target = { time: 0 }

  quickSeek = $gsap.quickTo(target, 'time', {
    duration: 0.5,
    ease: 'power2.out',
    onUpdate: () => {
      if (!video.value || duration <= 0) return
      video.value.currentTime = Math.min(target.time, Math.max(0, duration - 0.04))
    }
  })

  quickSeek(latestProgress * duration)
}

onMounted(() => {
  if (!root.value || !stage.value) return

  overHero.value = true

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const desktop = window.matchMedia('(min-width: 1024px)').matches
  const navigatorInfo = navigator as Navigator & {
    connection?: { saveData?: boolean }
    deviceMemory?: number
  }
  const lowPower = navigatorInfo.connection?.saveData === true
    || (navigatorInfo.hardwareConcurrency ?? 8) < 4
    || (navigatorInfo.deviceMemory ?? 8) < 4

  staticFallback.value = lowPower
  scrubEnabled.value = desktop && !reduce && !lowPower

  syncChrome()
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', syncChrome)

  if (!reduce) {
    heroContext = $gsap.context(() => {
      $gsap.from('[data-hero-enter]', {
        opacity: 0,
        y: 24,
        duration: motion.value.revealSeconds,
        stagger: 0.07,
        ease: motion.value.ease,
        clearProps: 'opacity,transform'
      })
    }, root.value)
  }

  if (!scrubEnabled.value) return

  loadVideo.value = true

  mediaQueries = $gsap.matchMedia()
  mediaQueries.add('(min-width: 1024px) and (prefers-reduced-motion: no-preference)', () => {
    if (!root.value || !stage.value) return

    const timeline = $gsap.timeline({
      defaults: { ease: motion.value.ease },
      scrollTrigger: {
        trigger: root.value,
        start: 'top top',
        end: 'bottom bottom',
        pin: stage.value,
        pinSpacing: false,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        scrub: true,
        onUpdate: self => seekToProgress(self.progress)
      }
    })

    if (intro.value) {
      timeline.to(intro.value, { autoAlpha: 0, yPercent: -3, duration: 0.1 }, 0.1)
    }

    if (stageOne.value) {
      timeline.fromTo(stageOne.value, { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: 0.07 }, 0.2)
      timeline.to(stageOne.value, { autoAlpha: 0, y: -28, duration: 0.07 }, 0.34)
    }

    if (stageTwo.value) {
      timeline.fromTo(stageTwo.value, { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: 0.07 }, 0.42)
      timeline.to(stageTwo.value, { autoAlpha: 0, y: -28, duration: 0.07 }, 0.6)
    }

    if (reveal.value) {
      timeline.fromTo(reveal.value, { autoAlpha: 0, y: 44 }, { autoAlpha: 1, y: 0, duration: 0.08 }, 0.7)
    }

    timeline.to({}, { duration: 0.12 }, 0.88)
  })
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll)
  window.removeEventListener('resize', syncChrome)
  if (scrollFrame) cancelAnimationFrame(scrollFrame)
  mediaQueries?.revert()
  heroContext?.revert()
  quickSeek = null
  overHero.value = false
})
</script>

<template>
  <section
    ref="root"
    data-hero-root
    :data-hero-static="staticFallback || undefined"
    class="relative isolate -mt-[4.5rem] overflow-clip bg-[var(--theme-hero-ground)] text-[var(--theme-hero-ink)]"
  >
    <div
      ref="stage"
      data-hero-shell
      class="relative flex flex-col overflow-hidden"
    >
      <div
        class="pointer-events-none absolute inset-x-0 top-0 z-0 h-[100svh]"
        aria-hidden="true"
      >
        <img
          :src="media.poster"
          alt=""
          width="1920"
          height="1080"
          fetchpriority="high"
          data-hero-media
          class="absolute inset-0 h-full w-full object-cover"
        >
        <video
          v-if="loadVideo"
          ref="video"
          data-hero-media
          class="absolute inset-0 h-full w-full object-cover transition-opacity duration-700 motion-reduce:transition-none"
          :class="videoReady ? 'opacity-100' : 'opacity-0'"
          :poster="media.poster"
          muted
          playsinline
          preload="auto"
          tabindex="-1"
          @loadedmetadata="onVideoMetadata"
          @loadeddata="videoReady = true"
        >
          <source
            :src="media.video"
            type="video/mp4"
          >
        </video>
        <div class="absolute inset-0 bg-[var(--theme-hero-ground)] opacity-40 lg:opacity-0" />
        <div
          class="absolute inset-x-0 top-0 h-44"
          :style="{ background: 'var(--theme-hero-top-scrim)' }"
        />
        <div
          class="absolute inset-0"
          :style="{ background: 'var(--theme-hero-scrim)' }"
        />
      </div>

      <div
        ref="intro"
        data-hero-intro
        class="relative z-10 flex min-h-[calc(100svh-4.5rem)] flex-col justify-center px-6 pb-10 pt-28 sm:px-10 lg:px-10 lg:pb-24 lg:pt-24"
      >
        <div class="mx-auto w-full max-w-[88rem]">
          <div class="flex items-center justify-between gap-6 text-[0.625rem] uppercase tracking-[0.24em] text-[var(--theme-hero-muted)]">
            <span>{{ copy.hero.eyebrow }}</span>
            <span class="hidden sm:inline">
              Lorem ipsum · 01
            </span>
          </div>

          <div class="mt-8 max-w-[42rem] lg:mt-10">
            <h1
              data-hero-enter
              class="font-heading text-[clamp(2.9rem,8vw,5.6rem)] leading-[0.94] tracking-[-0.02em] text-[var(--theme-hero-ink)]"
            >
              {{ copy.hero.titleLead }}<br>
              <span class="italic text-highlight">
                {{ copy.hero.titleAccent }}
              </span>
            </h1>

            <p
              data-hero-enter
              class="mt-5 font-heading text-[clamp(1.15rem,1.8vw,1.5rem)] italic leading-snug text-[var(--theme-hero-ink)]"
            >
              {{ copy.hero.subhead }}
            </p>

            <p class="mt-3 max-w-[46ch] text-sm leading-relaxed text-[var(--theme-hero-muted)]">
              {{ copy.hero.body }}
            </p>

            <dl
              data-hero-enter
              class="mt-7 grid max-w-[34rem] grid-cols-3 divide-x divide-[var(--theme-hero-line)] overflow-hidden rounded-theme border border-[var(--theme-hero-line)] bg-[var(--theme-hero-panel)] backdrop-blur-md"
            >
              <div class="px-3 py-3 sm:px-4">
                <dt class="text-[0.5rem] uppercase tracking-[0.16em] text-[var(--theme-hero-muted)] sm:text-[0.5625rem]">
                  {{ copy.hero.spec.family }}
                </dt>
                <dd class="mt-1.5 truncate text-xs text-[var(--theme-hero-ink)] sm:text-sm">
                  {{ familyLabel }}
                </dd>
              </div>
              <div class="px-3 py-3 sm:px-4">
                <dt class="text-[0.5rem] uppercase tracking-[0.16em] text-[var(--theme-hero-muted)] sm:text-[0.5625rem]">
                  {{ copy.hero.spec.intensity }}
                </dt>
                <dd class="mt-1.5 truncate text-xs text-[var(--theme-hero-ink)] sm:text-sm">
                  {{ intensityLabel }}
                </dd>
              </div>
              <div class="px-3 py-3 sm:px-4">
                <dt class="text-[0.5rem] uppercase tracking-[0.16em] text-[var(--theme-hero-muted)] sm:text-[0.5625rem]">
                  {{ copy.hero.spec.price }}
                </dt>
                <dd class="mt-1.5 truncate text-xs text-[var(--theme-hero-ink)] sm:text-sm">
                  {{ priceLabel }}
                </dd>
              </div>
            </dl>

            <p class="mt-3 flex items-center gap-2 text-[0.625rem] uppercase tracking-[0.18em] text-[var(--theme-hero-muted)]">
              <span
                class="size-1.5 shrink-0 rounded-full bg-highlight"
                aria-hidden="true"
              />
              {{ stockLine }}<template v-if="selectedSize">
                · {{ selectedSize.sizeMl }} ml
              </template>
            </p>

            <div
              data-hero-enter
              class="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center"
            >
              <UButton
                size="xl"
                color="primary"
                :loading="adding"
                :disabled="!selectedSize || adding"
                class="justify-center sm:min-w-44"
                @click="addToBag"
              >
                {{ copy.hero.primaryCta }}
              </UButton>
              <NuxtLink
                to="/shop"
                class="inline-flex min-h-11 items-center justify-center rounded-theme-sm border border-[var(--theme-hero-line)] bg-[var(--theme-hero-panel)] px-5 text-sm font-medium text-[var(--theme-hero-ink)] backdrop-blur-md transition-colors hover:border-[var(--theme-hero-ink)] hover:bg-[var(--theme-hero-ink)] hover:text-[var(--theme-hero-ground)]"
              >
                {{ copy.hero.secondaryCta }}
              </NuxtLink>
            </div>

            <NuxtLink
              to="/quiz"
              class="mt-4 inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-[var(--theme-hero-muted)] underline-offset-4 transition-colors hover:text-[var(--theme-hero-ink)] hover:underline"
            >
              {{ copy.hero.quizCta }}
              <UIcon
                name="i-lucide-arrow-up-right"
                class="size-3.5"
              />
            </NuxtLink>
          </div>
        </div>
      </div>

      <div
        data-hero-rail
        class="relative z-20 flex items-center justify-between gap-6 px-6 pb-5 sm:px-10 lg:px-10"
      >
        <a
          href="#collection"
          class="group inline-flex items-center gap-3 text-[0.625rem] uppercase tracking-[0.24em] text-[var(--theme-hero-muted)] transition-colors hover:text-[var(--theme-hero-ink)]"
        >
          <span
            class="h-8 w-px bg-[var(--theme-hero-line)] transition-colors group-hover:bg-[var(--theme-hero-ink)]"
            aria-hidden="true"
          />
          {{ copy.hero.scrollCue }}
        </a>

        <div
          v-if="scrubEnabled"
          class="flex items-center gap-3"
          role="progressbar"
          aria-label="Hero scroll progress"
          aria-valuemin="0"
          aria-valuemax="100"
          :aria-valuenow="progress"
        >
          <span class="text-[0.625rem] tabular-nums text-[var(--theme-hero-muted)]">{{ progress }}%</span>
          <span
            class="block h-px w-16 bg-[var(--theme-hero-line)]"
            aria-hidden="true"
          >
            <span
              class="block h-px bg-[var(--theme-hero-ink)] transition-[width] duration-150 ease-linear"
              :style="{ width: `${progress}%` }"
            />
          </span>
        </div>
      </div>

      <div
        ref="stageOne"
        data-hero-stage
      >
        <div class="w-full max-w-3xl">
          <p class="text-[0.625rem] uppercase tracking-[0.24em] text-[var(--theme-hero-muted)]">
            01 / 02
          </p>
          <p class="mt-5 font-heading text-[clamp(2rem,4.6vw,3.9rem)] italic leading-[1.04]">
            {{ copy.hero.stages[0]?.line }}
          </p>
          <p class="mt-4 text-xs uppercase tracking-[0.18em] text-[var(--theme-hero-muted)]">
            {{ copy.hero.stages[0]?.note }}
          </p>
        </div>
      </div>

      <div
        ref="stageTwo"
        data-hero-stage
      >
        <div class="w-full max-w-3xl">
          <p class="text-[0.625rem] uppercase tracking-[0.24em] text-[var(--theme-hero-muted)]">
            02 / 02
          </p>
          <p class="mt-5 font-heading text-[clamp(2rem,4.6vw,3.9rem)] italic leading-[1.04]">
            {{ copy.hero.stages[1]?.line }}
          </p>
          <p class="mt-4 text-xs uppercase tracking-[0.18em] text-[var(--theme-hero-muted)]">
            {{ copy.hero.stages[1]?.note }}
          </p>
        </div>
      </div>

      <div
        ref="reveal"
        data-hero-stage
        data-hero-reveal
      >
        <div class="w-full max-w-md rounded-theme border border-[var(--theme-hero-line)] bg-[var(--theme-hero-panel)] p-6 shadow-theme backdrop-blur-xl sm:p-8">
          <p class="text-[0.625rem] uppercase tracking-[0.22em] text-[var(--theme-hero-muted)]">
            {{ copy.hero.revealEyebrow }}
          </p>
          <p class="mt-2 font-heading text-3xl leading-tight">
            {{ product?.name }}
          </p>
          <p class="mt-2 text-sm text-[var(--theme-hero-muted)]">
            {{ priceLabel }} · {{ stockLine }}
          </p>

          <div class="mt-6 grid gap-2">
            <UButton
              block
              color="primary"
              :loading="adding"
              :disabled="!selectedSize || adding"
              @click="addToBag"
            >
              {{ copy.hero.primaryCta }}
            </UButton>
            <NuxtLink
              to="/shop"
              class="flex min-h-11 w-full items-center justify-center rounded-theme-sm border border-[var(--theme-hero-line)] px-5 text-sm font-medium text-[var(--theme-hero-ink)] transition-colors hover:border-[var(--theme-hero-ink)] hover:bg-[var(--theme-hero-ink)] hover:text-[var(--theme-hero-ground)]"
            >
              {{ copy.hero.secondaryCta }}
            </NuxtLink>
          </div>

          <NuxtLink
            to="/quiz"
            class="mt-4 block text-center text-[0.625rem] uppercase tracking-[0.2em] text-[var(--theme-hero-muted)] underline-offset-4 transition-colors hover:text-[var(--theme-hero-ink)] hover:underline"
          >
            {{ copy.hero.quizCta }}
          </NuxtLink>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
[data-hero-shell] {
  min-height: 100svh;
}

[data-hero-media] {
  object-position: 50% center;
}

@media (min-width: 1024px) {
  [data-hero-media] {
    object-position: 66% center;
  }
}

[data-hero-intro] {
  min-height: calc(100svh - 4.5rem);
}

[data-hero-rail] {
  min-height: 4.5rem;
}

[data-hero-stage] {
  position: relative;
  z-index: 10;
  display: flex;
  min-height: 50svh;
  align-items: center;
  justify-content: center;
  padding: 4rem 1.5rem;
  text-align: center;
}

[data-hero-reveal] {
  padding-bottom: 5rem;
}

@media (min-width: 1024px) and (prefers-reduced-motion: no-preference) {
  [data-hero-root] {
    min-height: 420svh;
  }

  [data-hero-shell] {
    height: 100svh;
    min-height: 0;
  }

  [data-hero-intro] {
    position: absolute;
    inset: 0;
    min-height: 0;
  }

  [data-hero-rail] {
    position: absolute;
    inset-inline: 0;
    bottom: 0;
    min-height: 0;
  }

  [data-hero-stage] {
    position: absolute;
    inset: 0;
    min-height: 0;
    align-items: flex-end;
    padding: 0 2.5rem 6.5rem;
    visibility: hidden;
    opacity: 0;
  }

  [data-hero-reveal] {
    padding-bottom: 5.5rem;
  }

  [data-hero-static][data-hero-root] {
    min-height: auto;
  }

  [data-hero-static][data-hero-shell] {
    height: auto;
    min-height: 100svh;
  }

  [data-hero-static] [data-hero-intro] {
    position: relative;
    inset: auto;
    min-height: calc(100svh - 4.5rem);
  }

  [data-hero-static] [data-hero-rail] {
    position: relative;
    inset: auto;
    bottom: auto;
    min-height: 4.5rem;
  }

  [data-hero-static] [data-hero-stage] {
    position: relative;
    inset: auto;
    min-height: 50svh;
    align-items: center;
    padding: 4rem 1.5rem;
    visibility: visible;
    opacity: 1;
  }

  [data-hero-static] [data-hero-reveal] {
    padding-bottom: 5rem;
  }
}
</style>
