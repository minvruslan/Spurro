import { fileURLToPath } from "node:url"
import { configDefaults, defineConfig } from "vitest/config"

const FullCoverageThresholds = { statements: 100, branches: 100, functions: 100, lines: 100 }

const modulesWithApprovedSpecifications: string[] = [
  "src/api/modules/config/**/*.ts",
  "src/api/modules/config-limit/**/*.ts",
  "src/api/modules/device-type/**/*.ts",
  "src/api/modules/endpoint/**/*.ts",
  "src/api/modules/protocol/**/*.ts",
  "src/api/modules/server/**/*.ts",
  "src/api/modules/user/**/*.ts",
  "src/core/crypto/**/*.ts",
]

const integrationTestGlobs = [
  "tests/src/api/**/*.test.ts",
  "tests/src/worker/**/*.test.ts",
  "tests/src/core/bootstraps/**/*.test.ts",
  "tests/helpers/**/*.test.ts",
]

export default defineConfig({
  resolve: {
    alias: {
      "@tests": fileURLToPath(new URL("./tests", import.meta.url)),
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    reporters: ["tree"],
    clearMocks: true,
    restoreMocks: true,
    mockReset: true,
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
          setupFiles: [
            "tests/setup/setupTestEnvironment.ts",
            "tests/setup/resetDatabaseBetweenTests.ts",
          ],
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
