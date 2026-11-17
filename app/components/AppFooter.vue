<script setup lang="ts">
import { copy } from '~/content/copy'
import { site } from '~/config/site'

const year = new Date().getFullYear()
</script>

<template>
  <footer class="border-t border-default">
    <div class="mx-auto max-w-[88rem] px-6 py-16 lg:px-10 lg:py-20">
      <div class="grid gap-12 lg:grid-cols-12">
        <div class="lg:col-span-5">
          <AppLogo />
          <p class="mt-5 max-w-[38ch] text-sm leading-relaxed text-muted">
            {{ copy.footer.blurb }}
          </p>
          <a
            :href="`mailto:${site.email}`"
            class="mt-6 inline-block text-sm text-default underline decoration-[var(--theme-border-strong)] underline-offset-4 transition-colors hover:text-primary"
          >
            {{ site.email }}
          </a>
        </div>

        <div
          v-for="column in copy.footer.columns"
          :key="column.title"
          class="lg:col-span-2"
        >
          <p class="text-sm text-highlighted">
            {{ column.title }}
          </p>
          <ul class="mt-4 space-y-3">
            <li
              v-for="link in column.links"
              :key="link.to"
            >
              <NuxtLink
                :to="link.to"
                class="text-sm text-muted transition-colors hover:text-default"
              >
                {{ link.label }}
              </NuxtLink>
            </li>
          </ul>
        </div>

        <div class="lg:col-span-3">
          <p class="text-sm text-highlighted">
            Lorem ipsum
          </p>
          <p class="mt-4 max-w-[30ch] text-sm leading-relaxed text-muted">
            {{ copy.announcement }}
          </p>
        </div>
      </div>
    </div>

    <div class="border-t border-default">
      <div class="mx-auto flex max-w-[88rem] flex-col gap-3 px-6 py-6 text-xs text-muted sm:flex-row sm:items-center sm:justify-between lg:px-10">
        <p>© {{ year }} {{ site.name }}</p>
        <p>{{ copy.footer.smallPrint }}</p>
      </div>
    </div>
  </footer>
</template>
