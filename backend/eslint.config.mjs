import rootEslintConfig from "../eslint.config.mjs"

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
      "Program:exit"(program) {
        const fileName = context.filename
          .split("/")
          .pop()
          .replace(/\.[^.]+$/, "")

        if (valueExports.length > 1) {
          context.report({
            node: valueExports[1].node,
            messageId: "multipleValueExports",
            data: { count: String(valueExports.length) },
          })
          return
        }

        if (valueExports.length === 0 && typeExports.length > 1) {
          context.report({
            node: typeExports[1].node,
            messageId: "multipleTypeExports",
            data: { count: String(typeExports.length) },
          })
          return
        }

        const mainExport = valueExports[0] ?? typeExports[0]
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
