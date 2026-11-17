<script setup lang="ts">
import type { Audience, Product, QuizQuestionId, QuizResult } from '~~/shared/types'
import { QUIZ_QUESTION_IDS } from '~~/shared/types'
import type { QuizAnswers } from '~~/shared/schemas/quiz'
import { QUIZ_QUESTIONS } from '~/config/quiz'
import { audienceOptions } from '~/config/themes'
import { copy } from '~/content/copy'
import { scentFamilyLabels } from '~~/shared/utils/labels'
import { formatPrice } from '~~/shared/utils/money'

const STORAGE_KEY = 'project-perfume-quiz'
const INTRO_STEP = 0
const AUDIENCE_STEP = 1
const TOTAL_QUESTIONS = QUIZ_QUESTIONS.length
const RESULT_STEP = TOTAL_QUESTIONS + 2

const audienceStore = useAudienceStore()
const cart = useCartStore()
const { $gsap } = useNuxtApp()

const step = ref(INTRO_STEP)
const answers = ref<Partial<Record<QuizQuestionId, string>>>({})
const quizAudience = ref<Audience>(audienceStore.audience)
const result = ref<QuizResult | null>(null)
const lastResult = ref<QuizResult | null>(null)
const submitting = ref(false)
const submitError = ref<string | null>(null)
const addBusy = ref(false)
const addError = ref<string | null>(null)
const modalOpen = ref(false)
const modalProduct = ref<Product | null>(null)
const activeIndex = ref(0)
const stepRef = ref<HTMLElement | null>(null)
const headingRef = ref<HTMLElement | null>(null)
const optionRefs = ref<(HTMLElement | null)[]>([])

const questionIndex = computed(() => step.value - 2)
const currentQuestion = computed(() => {
  const index = questionIndex.value
  return index >= 0 && index < TOTAL_QUESTIONS ? QUIZ_QUESTIONS[index] ?? null : null
})
const currentCopy = computed(() => currentQuestion.value ? copy.quiz.questions[currentQuestion.value.id] : null)
const currentOptions = computed(() => currentQuestion.value?.options ?? [])
const selectedOptionId = computed(() => currentQuestion.value ? answers.value[currentQuestion.value.id] ?? null : null)
const answeredCount = computed(() => QUIZ_QUESTION_IDS.filter(id => answers.value[id]).length)
const progress = computed(() => step.value === RESULT_STEP ? 100 : Math.round((answeredCount.value / TOTAL_QUESTIONS) * 100))
const matchSize = computed(() => result.value?.match?.product.sizes.find(size => size.stock > 0) ?? null)

const announcement = computed(() => {
  if (submitting.value) return copy.quiz.result.loading

  if (step.value === RESULT_STEP && result.value?.match) {
    return `${copy.quiz.result.matchLabel}: ${result.value.match.product.name}, ${result.value.match.matchPercent}%`
  }

  if (currentQuestion.value && currentCopy.value) {
    return `Question ${questionIndex.value + 1} of ${TOTAL_QUESTIONS}. ${currentCopy.value.question}`
  }

  if (step.value === AUDIENCE_STEP) return copy.quiz.audienceQuestion

  return ''
})

let advanceTimer: ReturnType<typeof setTimeout> | null = null
let stepMotion: ReturnType<typeof $gsap.matchMedia> | null = null

function clearAdvanceTimer() {
  if (advanceTimer) {
    clearTimeout(advanceTimer)
    advanceTimer = null
  }
}

function animateStep(direction: number) {
  const target = stepRef.value
  if (!import.meta.client || !target) return

  stepMotion?.revert()
  stepMotion = $gsap.matchMedia()
  stepMotion.add('(prefers-reduced-motion: no-preference)', () => {
    $gsap.fromTo(target, { opacity: 0, x: direction * 28 }, {
      opacity: 1,
      x: 0,
      duration: 0.45,
      ease: 'power3.out',
      clearProps: 'opacity,transform'
    })
  })
}

watch(step, async (next, previous) => {
  clearAdvanceTimer()
  await nextTick()

  const selected = currentQuestion.value ? answers.value[currentQuestion.value.id] : undefined
  const index = currentOptions.value.findIndex(option => option.id === selected)
  activeIndex.value = Math.max(0, index)

  animateStep(next >= previous ? 1 : -1)

  await nextTick()

  if (currentQuestion.value) {
    optionRefs.value[activeIndex.value]?.focus({ preventScroll: true })
  } else if (next !== INTRO_STEP) {
    headingRef.value?.focus({ preventScroll: true })
  }
})

function optionRef(index: number) {
  return (element: unknown) => {
    optionRefs.value[index] = element instanceof HTMLElement ? element : null
  }
}

function optionLabel(optionId: string) {
  return (currentCopy.value?.options as Record<string, string> | undefined)?.[optionId] ?? ''
}

function moveActive(delta: number) {
  if (!currentOptions.value.length) return
  const next = (activeIndex.value + delta + currentOptions.value.length) % currentOptions.value.length
  activeIndex.value = next
  optionRefs.value[next]?.focus()
}

function onOptionKeydown(event: KeyboardEvent) {
  if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
    event.preventDefault()
    moveActive(1)
  } else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
    event.preventDefault()
    moveActive(-1)
  }
}

function selectAnswer(optionId: string) {
  const question = currentQuestion.value
  if (!question || submitting.value) return

  answers.value = { ...answers.value, [question.id]: optionId }
  clearAdvanceTimer()

  const isLast = questionIndex.value === TOTAL_QUESTIONS - 1
  advanceTimer = setTimeout(() => {
    if (isLast) void submitQuiz()
    else step.value += 1
  }, 240)
}

function chooseAudience(value: Audience | null) {
  if (value) {
    quizAudience.value = value
    audienceStore.setAudience(value)
  }

  step.value = 2
}

function goBack() {
  clearAdvanceTimer()
  step.value = step.value <= AUDIENCE_STEP ? INTRO_STEP : step.value - 1
}

async function submitQuiz() {
  if (submitting.value) return
  if (!QUIZ_QUESTION_IDS.every(id => answers.value[id])) return

  submitting.value = true
  submitError.value = null

  try {
    const next = await $fetch<QuizResult>('/api/quiz/result', {
      method: 'POST',
      body: {
        audience: quizAudience.value,
        answers: answers.value as QuizAnswers
      }
    })

    result.value = next
    saveLastResult(next)
    step.value = RESULT_STEP
  } catch (caught) {
    submitError.value = apiErrorMessage(caught, 'The quiz could not be completed. Please try again.')
  } finally {
    submitting.value = false
  }
}

function saveLastResult(value: QuizResult) {
  lastResult.value = value
  if (!import.meta.client) return

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
  } catch {
    // Storage can be unavailable in private mode; the in-page result still works.
  }
}

function retake() {
  clearAdvanceTimer()
  answers.value = {}
  result.value = null
  submitError.value = null
  addError.value = null
  quizAudience.value = audienceStore.audience
  step.value = AUDIENCE_STEP
}

function viewLastResult() {
  if (!lastResult.value) return

  result.value = lastResult.value
  quizAudience.value = lastResult.value.audience
  step.value = RESULT_STEP
}

function openDetails(product: Product) {
  modalProduct.value = product
  modalOpen.value = true
}

async function addMatchToBag() {
  const match = result.value?.match
  if (!match || addBusy.value) return

  const size = match.product.sizes.find(item => item.stock > 0)
  if (!size) {
    addError.value = 'This fragrance is unavailable right now.'
    return
  }

  addBusy.value = true
  addError.value = null
  const added = await cart.add({ productId: match.product.id, sizeMl: size.sizeMl, quantity: 1 })
  addBusy.value = false

  if (!added) addError.value = cart.error ?? 'Your bag could not be updated. Please try again.'
}

onMounted(() => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return

    const parsed = JSON.parse(raw) as QuizResult
    if (!parsed?.match?.product?.slug || !Array.isArray(parsed.runnerUps)) return

    lastResult.value = parsed
  } catch {
    lastResult.value = null
  }
})

onBeforeUnmount(() => {
  clearAdvanceTimer()
  stepMotion?.revert()
})

useSeoMeta({
  title: 'Find your scent',
  description: copy.quiz.body,
  ogTitle: 'Find your scent',
  ogDescription: copy.quiz.body
})
</script>

<template>
  <section class="relative min-h-[calc(100dvh-4.5rem)]">
    <div class="mx-auto flex min-h-[calc(100dvh-4.5rem)] w-full max-w-[88rem] flex-col px-6 py-8 lg:px-10 lg:py-12">
      <div class="flex items-center justify-between gap-4">
        <p class="eyebrow">
          {{ copy.quiz.eyebrow }}
        </p>
        <p
          v-if="currentQuestion"
          class="text-xs text-muted"
        >
          {{ questionIndex + 1 }} / {{ TOTAL_QUESTIONS }}
        </p>
      </div>

      <UProgress
        v-if="step > INTRO_STEP"
        :model-value="progress"
        size="sm"
        aria-label="Quiz progress"
        class="mt-4"
      />

      <p
        class="sr-only"
        aria-live="polite"
        aria-atomic="true"
      >
        {{ announcement }}
      </p>

      <div class="flex flex-1 items-center">
        <div
          ref="stepRef"
          class="w-full py-10 lg:py-14"
        >
          <div
            v-if="step === INTRO_STEP"
            class="mx-auto max-w-2xl text-center"
          >
            <p class="eyebrow">
              {{ copy.quiz.eyebrow }}
            </p>
            <h1
              ref="headingRef"
              tabindex="-1"
              class="mt-5 font-heading text-[clamp(2.4rem,5vw,4.25rem)] leading-[1.05] text-balance text-highlighted focus-visible:outline-none"
            >
              {{ copy.quiz.title }}
            </h1>
            <p class="mx-auto mt-6 max-w-[46ch] text-base leading-relaxed text-muted">
              {{ copy.quiz.body }}
            </p>

            <div class="mt-10 flex flex-wrap items-center justify-center gap-3">
              <template v-if="lastResult">
                <UButton
                  size="xl"
                  color="primary"
                  label="View last result"
                  @click="viewLastResult"
                />
                <UButton
                  size="xl"
                  color="neutral"
                  variant="outline"
                  label="Retake quiz"
                  @click="retake"
                />
              </template>
              <UButton
                v-else
                size="xl"
                color="primary"
                label="Start the quiz"
                @click="retake"
              />
            </div>
          </div>

          <div
            v-else-if="step === AUDIENCE_STEP"
            class="mx-auto max-w-3xl"
          >
            <p class="eyebrow">
              Optional
            </p>
            <h1
              ref="headingRef"
              tabindex="-1"
              class="mt-4 font-heading text-[clamp(2rem,4vw,3.25rem)] leading-[1.08] text-balance text-highlighted focus-visible:outline-none"
            >
              {{ copy.quiz.audienceQuestion }}
            </h1>
            <p class="mt-4 max-w-[52ch] text-sm leading-relaxed text-muted">
              {{ copy.quiz.audienceHelp }}
            </p>

            <div class="mt-8 grid gap-3 sm:grid-cols-3">
              <button
                v-for="option in audienceOptions"
                :key="option.id"
                type="button"
                :aria-pressed="quizAudience === option.id"
                class="rounded-theme border px-5 py-4 text-start transition-colors"
                :class="quizAudience === option.id
                  ? 'border-primary bg-primary/10 text-highlighted'
                  : 'border-default bg-default text-default hover:border-accented hover:bg-elevated'"
                @click="chooseAudience(option.id)"
              >
                <span class="block text-sm">{{ option.label }}</span>
                <span class="mt-1 block text-xs leading-relaxed text-muted">{{ copy.quiz.audienceOptions[option.id] }}</span>
              </button>
            </div>

            <div class="mt-8 flex items-center justify-between gap-4">
              <UButton
                color="neutral"
                variant="ghost"
                icon="i-lucide-arrow-left"
                label="Back"
                @click="goBack"
              />
              <UButton
                color="neutral"
                variant="link"
                label="Skip"
                @click="chooseAudience(null)"
              />
            </div>
          </div>

          <div
            v-else-if="submitting"
            class="mx-auto max-w-xl text-center"
            aria-busy="true"
          >
            <UIcon
              name="i-lucide-loader-circle"
              class="mx-auto size-10 animate-spin text-primary"
            />
            <p class="mt-6 font-heading text-2xl text-highlighted">
              {{ copy.quiz.result.loading }}
            </p>
          </div>

          <div
            v-else-if="step === RESULT_STEP"
            class="mx-auto max-w-5xl"
          >
            <div
              v-if="result?.match"
              class="text-center"
            >
              <p class="eyebrow">
                {{ copy.quiz.result.eyebrow }}
              </p>
              <h1
                ref="headingRef"
                tabindex="-1"
                class="mt-4 font-heading text-[clamp(2rem,4vw,3.25rem)] leading-[1.08] text-highlighted focus-visible:outline-none"
              >
                {{ copy.quiz.result.title }}
              </h1>
            </div>

            <template v-if="result?.match">
              <article class="mt-10 grid overflow-hidden rounded-theme border border-default bg-elevated lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
                <img
                  :src="result.match.product.images[0]"
                  :alt="result.match.product.name"
                  width="800"
                  height="1000"
                  class="product-art aspect-[4/5] w-full object-cover"
                >

                <div class="flex flex-col p-6 lg:p-10">
                  <div class="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p class="eyebrow">
                        {{ copy.quiz.result.matchLabel }}
                      </p>
                      <p class="mt-2 text-xs text-muted">
                        {{ scentFamilyLabels[result.match.product.scentFamily] }}
                      </p>
                    </div>
                    <p class="font-heading text-4xl leading-none text-highlighted">
                      {{ result.match.matchPercent }}<span class="text-lg">%</span>
                    </p>
                  </div>

                  <h2 class="mt-6 font-heading text-3xl leading-tight text-highlighted">
                    {{ result.match.product.name }}
                  </h2>
                  <p class="mt-2 text-sm text-muted">
                    {{ result.match.product.tagline }}
                  </p>

                  <div class="mt-6 border-t border-default pt-5">
                    <p class="eyebrow">
                      {{ copy.quiz.result.whyTitle }}
                    </p>
                    <p class="mt-2 max-w-[48ch] text-sm leading-relaxed text-muted">
                      {{ copy.quiz.result.why }}
                    </p>
                  </div>

                  <p class="mt-6 font-heading text-2xl text-highlighted">
                    {{ formatPrice(matchSize?.priceCents ?? 0) }}
                  </p>

                  <UAlert
                    v-if="addError"
                    color="error"
                    variant="subtle"
                    :title="addError"
                    class="mt-4"
                    role="alert"
                  />

                  <div class="mt-6 flex flex-wrap gap-3">
                    <UButton
                      size="lg"
                      color="primary"
                      :loading="addBusy"
                      :disabled="addBusy"
                      @click="addMatchToBag"
                    >
                      Add to bag
                    </UButton>
                    <UButton
                      size="lg"
                      color="neutral"
                      variant="outline"
                      label="View details"
                      @click="openDetails(result.match.product)"
                    />
                  </div>
                </div>
              </article>

              <section
                v-if="result.runnerUps.length"
                class="mt-10"
              >
                <h2 class="font-heading text-2xl text-highlighted">
                  {{ copy.quiz.result.runnerUpTitle }}
                </h2>

                <div class="mt-4 grid gap-4 sm:grid-cols-2">
                  <button
                    v-for="runner in result.runnerUps"
                    :key="runner.product.id"
                    type="button"
                    class="flex gap-4 rounded-theme border border-default bg-default p-4 text-start transition-colors hover:border-accented hover:bg-elevated"
                    :aria-label="`View ${runner.product.name} details`"
                    @click="openDetails(runner.product)"
                  >
                    <img
                      :src="runner.product.images[0]"
                      alt=""
                      width="160"
                      height="200"
                      loading="lazy"
                      class="product-art aspect-[4/5] w-20 shrink-0 rounded-theme-sm border border-default object-cover"
                    >
                    <span class="flex min-w-0 flex-1 flex-col">
                      <span class="text-xs text-muted">{{ scentFamilyLabels[runner.product.scentFamily] }}</span>
                      <span class="mt-1 truncate font-heading text-lg text-highlighted">{{ runner.product.name }}</span>
                      <span class="mt-auto pt-3 text-sm text-default">{{ runner.matchPercent }}% match</span>
                    </span>
                  </button>
                </div>
              </section>

              <div class="mt-10 flex flex-wrap items-center justify-center gap-3">
                <UButton
                  color="neutral"
                  variant="outline"
                  label="Retake quiz"
                  @click="retake"
                />
              </div>
            </template>

            <div
              v-else
              class="mx-auto max-w-2xl text-center"
            >
              <h1
                ref="headingRef"
                tabindex="-1"
                class="font-heading text-[clamp(2rem,4vw,3.25rem)] leading-[1.08] text-balance text-highlighted focus-visible:outline-none"
              >
                {{ copy.quiz.result.emptyTitle }}
              </h1>
              <p class="mx-auto mt-5 max-w-[48ch] text-sm leading-relaxed text-muted">
                {{ copy.quiz.result.emptyBody }}
              </p>
              <div class="mt-8 flex flex-wrap items-center justify-center gap-3">
                <UButton
                  color="primary"
                  label="Retake quiz"
                  @click="retake"
                />
                <UButton
                  to="/shop"
                  color="neutral"
                  variant="outline"
                  label="Shop the collection"
                />
              </div>
            </div>
          </div>

          <div
            v-else-if="currentQuestion && currentCopy"
            class="mx-auto max-w-3xl"
          >
            <p class="eyebrow">
              Question {{ questionIndex + 1 }} of {{ TOTAL_QUESTIONS }}
            </p>
            <h1
              :id="`quiz-question-${currentQuestion.id}`"
              ref="headingRef"
              tabindex="-1"
              class="mt-4 font-heading text-[clamp(1.9rem,3.8vw,3rem)] leading-[1.1] text-balance text-highlighted focus-visible:outline-none"
            >
              {{ currentCopy.question }}
            </h1>

            <div
              role="group"
              :aria-labelledby="`quiz-question-${currentQuestion.id}`"
              class="mt-8 grid gap-3"
            >
              <button
                v-for="(option, index) in currentOptions"
                :key="option.id"
                :ref="optionRef(index)"
                type="button"
                :tabindex="index === activeIndex ? 0 : -1"
                :aria-pressed="selectedOptionId === option.id"
                class="flex min-h-14 w-full items-center justify-between gap-4 rounded-theme border px-5 py-4 text-start text-sm transition-colors"
                :class="selectedOptionId === option.id
                  ? 'border-primary bg-primary/10 text-highlighted'
                  : 'border-default bg-default text-default hover:border-accented hover:bg-elevated'"
                @focus="activeIndex = index"
                @click="selectAnswer(option.id)"
                @keydown="onOptionKeydown"
              >
                <span>{{ optionLabel(option.id) }}</span>
                <UIcon
                  v-if="selectedOptionId === option.id"
                  name="i-lucide-check"
                  class="size-4 shrink-0 text-primary"
                />
              </button>
            </div>

            <UAlert
              v-if="submitError"
              color="error"
              variant="subtle"
              :title="submitError"
              class="mt-6"
              role="alert"
            />

            <div class="mt-8 flex items-center justify-between gap-4">
              <UButton
                color="neutral"
                variant="ghost"
                icon="i-lucide-arrow-left"
                label="Back"
                @click="goBack"
              />
              <p class="text-xs text-muted">
                Use arrow keys to choose, Enter to continue
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <ProductModal
      :open="modalOpen"
      :product="modalProduct"
      @update:open="modalOpen = $event"
    />
  </section>
</template>
