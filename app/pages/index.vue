<script setup lang="ts">
import { copy } from '~/content/copy'
import { site } from '~/config/site'

useSeoMeta({
  title: site.name,
  description: copy.hero.body,
  ogTitle: site.name,
  ogDescription: copy.hero.body
})
</script>

<template>
  <div>
    <section class="border-b border-default">
      <div class="mx-auto grid max-w-[88rem] gap-14 px-6 pb-20 pt-16 sm:pt-20 lg:grid-cols-12 lg:gap-10 lg:px-10 lg:pb-28 lg:pt-24">
        <div class="lg:col-span-7">
          <p class="eyebrow">
            {{ copy.hero.eyebrow }}
          </p>

          <h1 class="mt-6 max-w-[15ch] font-heading text-[clamp(2.5rem,5.4vw,4.75rem)] leading-[1.04] text-balance text-highlighted">
            {{ copy.hero.title }}
          </h1>

          <p class="mt-7 max-w-[46ch] text-base leading-relaxed text-muted sm:text-lg">
            {{ copy.hero.body }}
          </p>

          <div class="mt-10 flex flex-wrap items-center gap-3">
            <UButton
              :to="'/shop'"
              size="xl"
              color="primary"
              :label="copy.hero.primaryCta"
            />
            <UButton
              :to="'/quiz'"
              size="xl"
              color="neutral"
              variant="outline"
              :label="copy.hero.secondaryCta"
            />
          </div>
        </div>

        <div class="lg:col-span-5 lg:pt-20">
          <div class="border-t border-default pt-6">
            <p class="max-w-[38ch] text-sm leading-relaxed text-muted">
              {{ copy.notes.intro }}
            </p>

            <dl class="mt-10">
              <div
                v-for="item in copy.notes.items"
                :key="item.label"
                class="grid grid-cols-[6.5rem_1fr] gap-4 border-b border-default py-6 first:pt-0"
              >
                <dt class="text-sm text-muted">
                  {{ item.label }}
                </dt>
                <dd class="text-sm leading-relaxed text-default">
                  {{ item.text }}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </section>

    <section class="border-b border-default">
      <div class="mx-auto max-w-[88rem] px-6 py-20 lg:px-10 lg:py-28">
        <div class="grid gap-10 lg:grid-cols-12">
          <h2 class="max-w-[16ch] font-heading text-[clamp(2rem,3.8vw,3.5rem)] leading-[1.06] text-balance lg:col-span-6">
            {{ copy.story.title }}
          </h2>
          <p class="max-w-[52ch] text-base leading-relaxed text-muted lg:col-span-5 lg:col-start-8">
            {{ copy.story.body }}
          </p>
        </div>

        <div class="mt-16 grid gap-px border-y border-default bg-[var(--theme-border)] sm:grid-cols-3">
          <div
            v-for="point in copy.story.points"
            :key="point.label"
            class="bg-default p-8 lg:p-10"
          >
            <p class="text-sm text-highlighted">
              {{ point.label }}
            </p>
            <p class="mt-4 max-w-[32ch] text-sm leading-relaxed text-muted">
              {{ point.text }}
            </p>
          </div>
        </div>
      </div>
    </section>

    <section class="mx-auto max-w-[88rem] px-6 py-24 text-center lg:px-10 lg:py-32">
      <h2 class="mx-auto max-w-[18ch] font-heading text-[clamp(2.25rem,4.6vw,4rem)] leading-[1.04] text-balance">
        {{ copy.closing.title }}
      </h2>
      <p class="mx-auto mt-6 max-w-[44ch] text-base leading-relaxed text-muted">
        {{ copy.closing.body }}
      </p>
      <UButton
        :to="'/shop'"
        size="xl"
        color="primary"
        :label="copy.closing.cta"
        class="mt-10"
      />
    </section>
  </div>
</template>
