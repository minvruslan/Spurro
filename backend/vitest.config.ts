import { fileURLToPath } from "node:url"
import { configDefaults, defineConfig } from "vitest/config"

const FullCoverageThresholds = { statements: 100, branches: 100, functions: 100, lines: 100 }

const modulesWithApprovedSpecifications: string[] = [
  "src/api/modules/device-type/**/*.ts",
  "src/api/modules/protocol/**/*.ts",
]

const integrationTestGlobs = [
  "tests/api/**/*.test.ts",
  "tests/worker/**/*.test.ts",
  "tests/helpers/**/*.test.ts",
]

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    reporters: ["tree"],
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          include: ["tests/**/*.test.ts"],
          exclude: [...configDefaults.exclude, ...integrationTestGlobs],
          setupFiles: ["tests/setup/setupTestEnvironment.ts"],
        },
      },
      {
        extends: true,
        test: {
          name: "integration",
          include: integrationTestGlobs,
          fileParallelism: false,
          setupFiles: ["tests/setup/setupTestEnvironment.ts"],
          globalSetup: ["tests/setup/prepareTestDatabase.ts"],
        },
      },
    ],
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      thresholds: Object.fromEntries(
        modulesWithApprovedSpecifications.map((moduleGlob) => [moduleGlob, FullCoverageThresholds]),
      ),
    },
  },
})
