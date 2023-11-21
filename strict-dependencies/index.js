/* eslint-disable */

const path = require('path')
const mm = require('micromatch')
const isGlob = require('is-glob')
const normalize = require('normalize-path')

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
              excludeTypeImportChecks: {
                type: 'boolean'
              }
            },
          },
        ],
      },
      {
        type: 'object',
        properties: {
          resolveRelativeImport: {
            type: 'boolean',
          },
          pathIndexMap: {
            type: 'object'
          }
        },
      },
    ],
  },
  create: (context) => {
    const dependencies = context.options[0]
    const options = context.options.length > 1 ? context.options[1] : {}
    const resolveRelativeImport = options.resolveRelativeImport
    const pathIndexMap = options.pathIndexMap ? options.pathIndexMap : {}

    function checkImport(node) {
      const fileFullPath = context.getFilename()
      const relativeFilePath = normalize(path.relative(process.cwd(), fileFullPath))
      const importPath = resolveImportPath(node.source.value, resolveRelativeImport ? relativeFilePath : null, pathIndexMap)

      // specにはImportDefaultSpecifier/ImportNamespaceSpecifier/ImportSpecifierがあり、ImportSpecifierの場合はimportedが存在する
      const importedModules = node.specifiers.filter(spec => 'imported' in spec).map(spec => spec.imported.name)

      dependencies
        .forEach((dependency) => {
          // そもそもmoduleがimportPathと一致していない場合は必ず報告しない
          if (!isMatch(importPath, dependency.module)) return;

          /**
           * 1. 参照元チェックをしてAllowであればそこで処理を終了する
           * 2. targetMembersが指定されていれば、targetMembersと実際にimportしているモジュールを比較して含まれていればエラーレポートして処理を終了する
           * 3. targetMembersが指定されていない場合は、エラー扱いなのでエラーレポートして処理を終了する
           */

          const isAllowedByPath =
          // 参照元が許可されている
          dependency.allowReferenceFrom.some((allowPath) =>
            isMatch(relativeFilePath, allowPath),
          ) || // または同一モジュール間の参照が許可されている場合
          (dependency.allowSameModule && isMatch(relativeFilePath, dependency.module))
          // または明示的に対象外としたtype importである場合
          || (dependency.excludeTypeImportChecks && node.importKind === 'type')

          if (isAllowedByPath) return

          // importedされた値・型名もLintのターゲットに入っている場合の検出処理
          function getCommonElements(arrA, arrB) {
            return arrA.filter(element => arrB.includes(element));
          }
          if (dependency.targetMembers && Array.isArray(dependency.targetMembers)) {
            const commonImportedList = getCommonElements(dependency.targetMembers, importedModules)
            if (commonImportedList.length > 0) {
              context.report(node, `import specifier '${commonImportedList.join(', ')}' is not allowed from ${relativeFilePath}.`)
            }
            return;
          }

          context.report(node, `import '${importPath}' is not allowed from ${relativeFilePath}.`)
        })
    }

    return {
      ImportDeclaration: checkImport,
    }
  },
}
