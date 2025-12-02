import tailwindcss from "@tailwindcss/vite"

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxt/eslint', '@nuxt/hints', '@nuxt/ui'],

  css: ['~/assets/css/main.css'],

  runtimeConfig: {
    DATABASE_URL: ''
  },
  vite: {
    plugins: [
      tailwindcss(),
    ],
  },
  eslint: {
    config: {
      stylistic: {
        quotes: 'single',
        semi: false,
      },
    },
  },
})