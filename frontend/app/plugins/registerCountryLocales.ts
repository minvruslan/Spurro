import countries from "i18n-iso-countries"
import enLocale from "i18n-iso-countries/langs/en.json"
import ruLocale from "i18n-iso-countries/langs/ru.json"

export default defineNuxtPlugin(() => {
  countries.registerLocale(enLocale)
  countries.registerLocale(ruLocale)
})
