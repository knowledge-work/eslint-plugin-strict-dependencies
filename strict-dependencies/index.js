/* eslint-disable */

const path = require('path')
const mm = require('micromatch')
const isGlob = require('is-glob')

const resolveImportPath = require('./resolveImportPath')

/**
 * pathのmatcher。
 * eslintrcで設定できる値は以下のケースを扱う
 * - globパターン指定
 * - globパターン以外の場合 => 前方部分一致
 */
const isMatch = (str, pattern) =>
  isGlob(pattern) ? mm.isMatch(str, pattern) : str.startsWith(pattern)

module.exports = {
  meta: {
    type: 'suggestion',
    schema: [
      {
        type: 'array',
        items: [
          {
            type: 'object',
            properties: {
              module: {
                type: 'string',
              },
              allowReferenceFrom: {
                type: 'array',
                items: [
                  {
                    type: 'string',
                  },
                ],
              },
              allowSameModule: {
                type: 'boolean',
              },
            },
          },
        ],
      },
    ],
  },
  create: (context) => {
    const dependencies = context.options[0]

    function checkImport(node) {
      const fileFullPath = context.getFilename()
      const relativeFilePath = path.relative(process.cwd(), fileFullPath)
      const importPath = resolveImportPath(node.source.value)

      dependencies
        .filter((dependency) => isMatch(importPath, dependency.module))
        .forEach((dependency) => {
          const isAllowed =
            // 参照元が許可されている
            dependency.allowReferenceFrom.some((allowPath) =>
              isMatch(relativeFilePath, allowPath),
            ) || // または同一モジュール間の参照が許可されている場合
            (dependency.allowSameModule && isMatch(relativeFilePath, dependency.module))

          if (!isAllowed) {
            context.report(node, `import '${importPath}' is not allowed from ${dependency.module}.`)
          }
        })
    }

    return {
      ImportDeclaration: checkImport,
    }
  },
}
