export default defineI18nConfig(() => ({
  legacy: false,
  fallbackLocale: "ru",
  // Feature/screen strings are co-located in their slices and registered via
  // `useI18n({ useScope: "local", messages })`. Keep the global catalog empty.
  messages: { ru: {}, en: {} },
}))
