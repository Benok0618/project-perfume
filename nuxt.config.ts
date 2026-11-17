// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/ui',
    '@pinia/nuxt',
    '@vueuse/nuxt',
    '@nuxt/image',
    '@nuxt/fonts',
    'nuxt-auth-utils'
  ],

  devtools: {
    enabled: true
  },

  css: ['~/assets/css/main.css'],

  ui: {
    fonts: false
  },

  runtimeConfig: {
    databaseUrl: '',
    adminEmail: '',
    adminPassword: ''
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
