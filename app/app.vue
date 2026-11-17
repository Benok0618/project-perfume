<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { site } from '~/config/site'
import { getAudienceOption } from '~/config/themes'
import { useAudienceStore } from '~/stores/audience'

const { audience } = storeToRefs(useAudienceStore())
const audienceMeta = computed(() => getAudienceOption(audience.value))

useHead({
  htmlAttrs: {
    'lang': 'en',
    'data-theme': audience,
    'style': computed(() => `color-scheme: ${audienceMeta.value.colorScheme}`)
  },
  link: [
    { rel: 'icon', href: '/favicon.ico' }
  ],
  meta: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1' },
    { name: 'theme-color', content: computed(() => audienceMeta.value.themeColor) }
  ]
})

useSeoMeta({
  titleTemplate: title => title && title !== site.name ? `${title} | ${site.name}` : site.name,
  description: site.description,
  ogTitle: site.name,
  ogDescription: site.description,
  twitterCard: 'summary_large_image'
})
</script>

<template>
  <UApp>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
