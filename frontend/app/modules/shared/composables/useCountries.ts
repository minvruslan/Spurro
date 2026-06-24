import { computed } from "vue"
import countries from "i18n-iso-countries"

export function useCountries() {
  const { locale } = useI18n()

  const lang = computed(() => (locale.value === "ru" ? "ru" : "en"))

  const options = computed(() =>
    Object.entries(countries.getNames(lang.value, { select: "official" }))
      .map(([code, name]) => ({ code, name }))
      .sort((a, b) => a.name.localeCompare(b.name)),
  )

  const getCountryName = (code: string) =>
    countries.getName(code, lang.value, { select: "official" }) ?? code

  return { options, getCountryName }
}
