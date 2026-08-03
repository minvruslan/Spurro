import { dirname, resolve } from "node:path"
import rootEslintConfig from "../eslint.config.mjs"

const LOGGER_METHOD_NAMES = new Set(["trace", "debug", "info", "warn", "error", "fatal"])

const messageStartsUppercaseRule = {
  meta: {
    type: "problem",
    schema: [],
    messages: {
      lowercaseMessage: "Log and error messages must start with an uppercase letter.",
    },
  },
  create(context) {
    const firstTextCharacter = (node) => {
      if (node.type === "Literal" && typeof node.value === "string") return node.value[0]
      if (node.type === "TemplateLiteral") return node.quasis[0]?.value.cooked?.[0]
      return undefined
    }

    const checkMessageArgument = (argument) => {
      const character = firstTextCharacter(argument)
      if (character && /[a-zа-я]/.test(character)) {
        context.report({ node: argument, messageId: "lowercaseMessage" })
      }
    }

    return {
      NewExpression(node) {
        if (node.callee.type !== "Identifier" || !node.callee.name.endsWith("Error")) return
        if (node.arguments[0]) checkMessageArgument(node.arguments[0])
      },
      CallExpression(node) {
        if (node.callee.type !== "MemberExpression") return
        const { object, property } = node.callee
        if (property.type !== "Identifier" || !LOGGER_METHOD_NAMES.has(property.name)) return
        if (object.type !== "Identifier" || !/(logger|Logger)$/.test(object.name)) return
        for (const argument of node.arguments) checkMessageArgument(argument)
      },
    }
  },
}

const MODULE_PATH_PATTERN = /\/src\/api\/modules\/([^/]+)(\/|$)/

const moduleBoundariesRule = {
  meta: {
    type: "problem",
    schema: [],
    messages: {
      deepImport: 'Import from module "{{module}}" through its index, not "{{source}}" directly.',
    },
  },
  create(context) {
    const ownModule = context.filename.match(MODULE_PATH_PATTERN)?.[1]
    if (!ownModule) return {}

    return {
      ImportDeclaration(node) {
        const source = node.source.value
        if (typeof source !== "string" || !source.startsWith(".")) return

        const resolvedPath = resolve(dirname(context.filename), source)
        const importedModule = resolvedPath.match(MODULE_PATH_PATTERN)?.[1]
        if (!importedModule || importedModule === ownModule) return

        if (!/\/index(\.js|\.ts)?$/.test(resolvedPath)) {
          context.report({
            node: node.source,
            messageId: "deepImport",
            data: { module: importedModule, source },
          })
        }
      },
    }
  },
}

const singleExportRule = {
  meta: {
    type: "problem",
    schema: [],
    messages: {
      multipleValueExports: "File must have a single value export, found {{count}}.",
      multipleTypeExports:
        "File without a value export must have a single type export, found {{count}}.",
      nameMismatch: 'File "{{fileName}}.ts" must be named after its export "{{exportName}}".',
    },
  },
  create(context) {
    const valueExports = []
    const typeExports = []

    const collectNamed = (node) => {
      if (node.declaration) {
        const target = node.exportKind === "type" ? typeExports : valueExports
        if (node.declaration.id) {
          target.push({ node, name: node.declaration.id.name })
        } else if (node.declaration.declarations) {
          for (const declaration of node.declaration.declarations) {
            if (declaration.id.type === "Identifier") {
              target.push({ node, name: declaration.id.name })
            }
          }
        }
      }

      for (const specifier of node.specifiers ?? []) {
        const isType = node.exportKind === "type" || specifier.exportKind === "type"
        const name = specifier.exported.name ?? specifier.exported.value
        ;(isType ? typeExports : valueExports).push({ node: specifier, name })
      }
    }

    return {
      ExportNamedDeclaration: collectNamed,
      ExportDefaultDeclaration(node) {
        const name =
          node.declaration.type === "Identifier"
            ? node.declaration.name
            : (node.declaration.id?.name ?? undefined)
        valueExports.push({ node, name })
      },
      ExportAllDeclaration(node) {
        valueExports.push({ node, name: undefined })
      },
      "Program:exit"() {
        const fileName = context.filename
          .split("/")
          .pop()
          .replace(/\.[^.]+$/, "")

        const uniqueValueExports = valueExports.filter(
          (entry, index) =>
            entry.name === undefined ||
            valueExports.findIndex((candidate) => candidate.name === entry.name) === index,
        )

        if (uniqueValueExports.length > 1) {
          context.report({
            node: uniqueValueExports[1].node,
            messageId: "multipleValueExports",
            data: { count: String(uniqueValueExports.length) },
          })
          return
        }

        if (uniqueValueExports.length === 0 && typeExports.length > 1) {
          context.report({
            node: typeExports[1].node,
            messageId: "multipleTypeExports",
            data: { count: String(typeExports.length) },
          })
          return
        }

        const mainExport = uniqueValueExports[0] ?? typeExports[0]
        if (mainExport?.name && mainExport.name !== fileName) {
          context.report({
            node: mainExport.node,
            messageId: "nameMismatch",
            data: { fileName, exportName: mainExport.name },
          })
        }
      },
    }
  },
}

export default [
  ...rootEslintConfig,
  {
    files: ["tests/**/*.ts"],
    rules: {
      "func-style": ["error", "declaration", { allowArrowFunctions: false }],
    },
  },
  {
    files: ["src/**/*.ts"],
    ignores: ["**/index.ts", "src/core/database/schemas/**", "src/core/logger/**"],
    plugins: {
      spurro: {
        rules: {
          "single-export": singleExportRule,
        },
      },
    },
    rules: {
      "spurro/single-export": "error",
    },
  },
  {
    files: ["src/**/*.ts"],
    plugins: {
      spurroStyle: {
        rules: {
          "message-starts-uppercase": messageStartsUppercaseRule,
          "module-boundaries": moduleBoundariesRule,
        },
      },
    },
    rules: {
      "spurroStyle/message-starts-uppercase": "error",
      "spurroStyle/module-boundaries": "error",
    },
  },
  {
    files: ["src/worker/jobs/**/steps/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["**/queries/*", "@/core/database*", "@/core/logger*"],
              message: "Steps must not touch the database or logger; return data to the job.",
            },
          ],
        },
      ],
    },
  },
]
