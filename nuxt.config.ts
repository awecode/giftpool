import tailwindcss from "@tailwindcss/vite"

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxt/eslint', '@nuxt/hints', '@nuxt/ui'],

  css: ['~/assets/css/main.css'],

  runtimeConfig: {
    DATABASE_URL: '',
    ses: {
      region: process.env.NUXT_SES_REGION || 'us-east-1',
      accessKeyId: process.env.NUXT_SES_ACCESS_KEY_ID || '',
      secretKey: process.env.NUXT_SES_SECRET_KEY || '',
      fromEmail: process.env.NUXT_SES_FROM_EMAIL || '',
    },
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