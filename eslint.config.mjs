import tseslint from "typescript-eslint"
import eslintConfigPrettier from "eslint-config-prettier"

export default tseslint.config(
  {
    ignores: ["**/node_modules/**", "**/.nuxt/**", "**/.output/**", "**/dist/**", "frontend/"],
  },
  ...tseslint.configs.recommended,
  eslintConfigPrettier,
)
