// @ts-check
import withNuxt from "./.nuxt/eslint.config.mjs"
import eslintConfigPrettier from "eslint-config-prettier"

export default withNuxt(
  eslintConfigPrettier,
  {
    ignores: ["app/components/ui/**"],
  },
  {
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@vancloak/backend*", "@vancloak/infrastructure*"],
              message: "Frontend may only import from @vancloak/api-contract.",
            },
          ],
        },
      ],
    },
  },
)
