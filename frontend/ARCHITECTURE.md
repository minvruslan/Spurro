# Architecture Rules (Nuxt 4 + FSD)

## 1. General Principles

- Use Feature-Sliced Design (FSD).
- Follow strict layer separation.
- Do not mix concerns between layers.
- Each layer exposes a public API via `index.ts` — no deep imports allowed.

## 2. Project Structure

```
app/
├── app.vue
├── assets/
│   └── css/
│       └── tailwind.css
├── pages/
│   ├── login.vue
│   ├── admin/
│   │   └── index.vue
│   └── app/
│       └── index.vue
├── layouts/
│   └── auth.vue
├── middlewares/
│   ├── admin.ts
│   ├── guest.ts
│   └── user.ts
├── composables/
│   └── useAuthSession.ts
├── plugins/
│   ├── provideAuthClient.ts
│   └── provideSSRWidth.ts
├── components/
│   └── ui/                          # shadcn components
└── modules/
    ├── entities/
    │   └── brand/
    │       ├── components/
    │       │   ├── BrandIcon.vue
    │       │   └── BrandIconWithText.vue
    │       └── index.ts
    ├── features/
    │   └── login/
    │       ├── composables/
    │       │   └── useLogin.ts
    │       ├── components/
    │       │   ├── LoginCard.vue
    │       │   ├── LoginForm.vue
    │       │   └── LoginEmailSent.vue
    │       ├── services/
    │       │   ├── requestLoginLink.ts
    │       │   ├── logout.ts
    │       │   └── index.ts
    │       ├── translations/
    │       │   ├── LoginForm.ts
    │       │   └── LoginEmailSent.ts
    │       └── index.ts
    └── shared/
        └── services/
            ├── api.ts               # Base $fetch wrapper
            └── index.ts
```

## 3. Nuxt-specific Rules

- `app/modules/` is NOT auto-imported by Nuxt — FSD layers use explicit imports via `index.ts`.
- All utilities live in `app/modules/shared/utils/` — not in `app/utils/`.

## 4. Monorepo Shared Package (`@spurro/shared`)

Domain schemas and types are defined in the `@spurro/shared` package (the monorepo root package), not inside the frontend tree.

This package is the **single source of truth** for:

- Domain Zod schemas (`ConfigSchema`, `ConfigLimitSchema`, etc.).
- Inferred domain types (`Config`, `ConfigLimit`, etc.).

## 5. Authentication & Authorization

Authentication and authorization are built on top of `better-auth`.

### Authentication

- Login is passwordless (magic link).
- The better-auth client is created in `app/plugins/provideAuthClient.ts` and injected as `$authClient`.
- `$authClient` is better-auth's typed client for the server's endpoints.
- Session state lives in the `useAuthSession()` composable, exposing `user`, `isLoggedIn`, `isAdmin`, and `refresh()`.
- The plugin calls `refresh()` during SSR so the session is hydrated on the server.

### Authorization

- The user role comes from the session (`isAdmin` = `role === "admin"`).
- Access control is enforced by route middlewares in `app/middlewares/`, opted into per page via `definePageMeta({ middleware: "..." })`:
  - `guest` — guest-only pages (e.g. `login`); redirects authenticated users away.
  - `user` — requires a logged-in user; redirects admins to `/admin`.
  - `admin` — requires the `admin` role; sends non-admins to `/app` and anonymous users to `/login`.

## 6. Translations (i18n)

Localization uses `@nuxtjs/i18n`. Translations are **co-located with the component that uses them**, not in a global catalog.

Rules:

- Translation files are `PascalCase` matching the component name, and live in a `translations/` directory.
- Always use `useScope: "local"` so messages don't leak across components.
- Global config lives in `app/i18n/i18n.config.ts`. The global `messages` catalog is kept empty on purpose.
- Locales are declared in `nuxt.config.ts` (default `ru`, cookie-based browser detection).

```ts
// modules/features/login/translations/LoginForm.ts
export const messages = {
  ru: { sendLoginLinkButton: "Отправить ссылку для входа" },
  en: { sendLoginLinkButton: "Send login link" },
}
```

```ts
// modules/features/login/components/LoginForm.vue
import { messages } from "../translations/LoginForm"
const { t } = useI18n({ useScope: "local", messages })
// t("sendLoginLinkButton")
```

## 7. Layer Responsibilities

### Entities

Domain API calls and UI for a single entity.

Rules:

- Use types and schemas from `@spurro/shared`.
- Validate all API responses against Zod schemas from `@spurro/shared` at the boundary.
- Provide simple UI components.
- Must not depend on `features` or `widgets`.
- Must not depend on other entities.

### Features

Use-cases and business logic built on top of entities.

Rules:

- Implement use-cases (e.g. login).
- Use entities via their public API only.
- Add `types/` or `stores/` subdirectories only when the feature grows to need them.
- Derive form schemas directly from `@spurro/shared` schemas inside composables when no extra frontend-specific validation is needed.
- May be grouped under a domain subdirectory (e.g. `admin/`) when belonging to a specific section of the app.
- Must not depend on other features.
- Must not depend on `widgets`.

### Widgets

UI sections assembled from features and entities.

Rules:

- Compose features and entities into UI blocks.
- Must not contain business logic.
- Must not make direct API calls.

### Pages

Top-level entry point for each route.

Rules:

- Keep thin — compose widgets or features only.
- May use a feature directly if the feature is self-contained and no widget composition is needed.
- Must not contain business logic or make API calls.
- Must not use composables with logic — layout and routing only.

## 8. Dependency Rules

### Allowed:

```
@spurro/shared → entities → features → widgets (can be skipped) → pages
```

### Cross-feature communication:

Features must NOT import each other. If two features need to share state:

- Extract shared state into an entity (promote to domain level).
- Or pass data through a widget that composes both features.

## 9. Data Fetching Rules

- Put all API calls inside `modules/*/*/services/`.
- Keep each request in a separate file — `index.ts` only re-exports.
- Call API via entity service functions — not directly via `$fetch`.
- Use `useAsyncData` inside feature composables, not in components.
- Validate all API responses via Zod before returning.

## 10. State Management (Pinia)

Rules:

- Don't create a global store.
- Promote shared state to an entity when it is needed by more than one feature.
- Add stores only when composables are insufficient.

## 11. Naming Conventions

### Folders

- All folders are `kebab-case` in plural form: `schemas/`, `types/`, `services/`, `components/`.
- Exception — entity, feature and widget segment folders are singular: `brand/`, `login/`.
- Features may be grouped under a domain directory: `features/admin/config-list/`.

### Files

- Vue components: `PascalCase` — `BrandIcon.vue`, `LoginForm.vue`.
- Composables: `camelCase` with `use` prefix — `useLogin.ts`.
- Stores: `camelCase` with `use` + `Store` suffix — `useConfigListStore.ts`.
- Schema files: `PascalCase` matching export name — `ConfigSchema.ts`.
- Type files: `PascalCase` matching export name — `Config.ts`.
- Function files: `camelCase` matching function name — `requestLoginLink.ts`, `logout.ts`.
- Plugins: `camelCase` describing what is provided — `provideSSRWidth.ts`.

## 12. Scalability Checklist

| Question                                             | Where                     |
| ---------------------------------------------------- | ------------------------- |
| Does it implement a use-case?                        | `features/`               |
| Is it a reusable domain API call or entity UI?       | `entities/`               |
| Is it UI logic tightly coupled to entity components? | `entities/*/composables/` |
| Does it compose multiple features into UI?           | `widgets/`                |
| Is it a pure utility with no business logic?         | `shared/utils/`           |
| Is it a base UI component (no domain)?               | `app/components/ui/`      |
| Is it a domain data schema or type?                  | `@spurro/shared`          |
| Is state shared between features?                    | Promote to entity domain  |
| Is it shared between frontend and backend?           | `@spurro/shared`          |
