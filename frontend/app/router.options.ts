import type { RouterConfig } from "@nuxt/schema"

function findHashElement(hash: string): Element | null {
  try {
    return document.querySelector(hash)
  } catch {
    return null
  }
}

export default {
  scrollBehavior(to, _from, savedPosition) {
    if (savedPosition) return savedPosition
    if (to.hash && findHashElement(to.hash)) return { el: to.hash }
    return { top: 0, left: 0 }
  },
} satisfies RouterConfig
