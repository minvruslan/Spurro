import tailwindcss from "@tailwindcss/vite"

export default defineNuxtConfig({
  app: {
    head: {
      title: "Spurro",
      meta: [{ name: "description", content: "Spurro" }],
      link: [{ rel: "icon", type: "image/svg+xml", href: "/favicon.svg" }],
    },
  },
  build: {
    transpile: ["@spurro/shared"],
  },
  runtimeConfig: {
    public: {
      apiBaseUrl: "",
      authBaseUrl: "",
    },
  },
  routeRules: {
    "/": { redirect: "/login" },
  },
  nitro: {
    devProxy: {
      "/api": { target: "http://localhost:4000/api", changeOrigin: true },
    },
  },
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  css: ["~/assets/css/tailwind.css"],
  vite: {
    plugins: [tailwindcss()],
  },
  modules: ["shadcn-nuxt", "@nuxt/eslint", "@nuxtjs/i18n", "@nuxt/fonts"],
  fonts: {
    defaults: {
      weights: [400, 500, 600, 700],
      subsets: ["latin", "cyrillic"],
    },
    experimental: {
      processCSSVariables: true,
    },
  },
  shadcn: {
    prefix: "",
    componentDir: "@/components/ui",
  },
  i18n: {
    restructureDir: "app/i18n",
    strategy: "no_prefix",
    defaultLocale: "ru",
    locales: [
      { code: "ru", language: "ru-RU", name: "Русский" },
      { code: "en", language: "en-US", name: "English" },
    ],
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: "i18n_locale",
      redirectOn: "root",
      fallbackLocale: "ru",
    },
    vueI18n: "i18n.config.ts",
  },
  dir: {
    middleware: "middlewares",
  },
})
