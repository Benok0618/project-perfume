// https://nuxt.com/docs/api/configuration/nuxt-config
import { site } from './app/config/site'

export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/ui',
    '@pinia/nuxt',
    '@vueuse/nuxt',
    '@nuxt/image',
    '@nuxt/fonts',
    '@nuxtjs/sitemap',
    'nuxt-auth-utils'
  ],

  devtools: {
    enabled: true
  },

  app: {
    pageTransition: { name: 'page', mode: 'out-in' }
  },

  css: ['~/assets/css/main.css'],

  site: {
    url: process.env.NUXT_PUBLIC_SITE_URL || site.url,
    name: site.name
  },

  ui: {
    fonts: false
  },

  runtimeConfig: {
    databaseUrl: '',
    databaseAuthToken: '',
    adminEmail: '',
    adminPassword: '',
    public: {
      siteUrl: ''
    }
  },

  compatibilityDate: '2026-06-30',

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  },

  fonts: {
    families: [
      { name: 'Public Sans', provider: 'google', weights: [400, 500, 600] },
      { name: 'Oswald', provider: 'google', weights: [400, 500, 600] },
      { name: 'Cormorant Garamond', provider: 'google', weights: [400, 500, 600], styles: ['normal', 'italic'] },
      { name: 'EB Garamond', provider: 'google', weights: [400, 500, 600], styles: ['normal', 'italic'] }
    ]
  }
})
