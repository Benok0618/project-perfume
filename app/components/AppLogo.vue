<script setup lang="ts">
import { site } from '~/config/site'

withDefaults(defineProps<{ tone?: 'default' | 'hero' }>(), { tone: 'default' })
</script>

<template>
  <span
    class="font-heading text-[1.4rem] leading-none tracking-[0.01em]"
    :class="tone === 'hero' ? 'text-[var(--theme-hero-ink)]' : 'text-highlighted'"
  >{{ site.name }}</span>
</template>
