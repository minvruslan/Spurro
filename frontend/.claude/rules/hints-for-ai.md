# Hints for AI

## Nuxt path aliases

`@` maps to `app/` (configured by Nuxt in `.nuxt/tsconfig.json`).
Imports must be `@/modules/...`, never `@/app/modules/...`.

## Vue conventions

- `ref` for form and local state, not `reactive`.
- `use*` composables live in `app/composables/` (auto-imported), never in `modules/**/services`.
- Spacing and sizing only via Tailwind scale tokens — no arbitrary values (`[..px]`), no em/rem in our components.
- A visual that only mirrors adjacent text (bars, pills) is decorative: `aria-hidden="true"`, not a progressbar/meter role.

## Gotchas

- A literal `@` in vue-i18n messages (e.g. emails) must be escaped as `{'@'}` — otherwise the page 500s.
- Blocking a `NuxtLink` click requires `@click.capture` with `preventDefault` — a plain `@click` handler does not stop RouterLink navigation.
- `shadcn-vue add` overwrites the customized `ui/button` (custom `loading` prop) — `git checkout` it after adding components.
