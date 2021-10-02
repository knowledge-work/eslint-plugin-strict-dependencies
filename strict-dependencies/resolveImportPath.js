/* eslint-disable */

const fs = require('fs')
const path = require('path')

/**
 * import文のrootからのパスを求める
 */
module.exports = (importPath, relativeFilePath) => {
  // { [importAlias: string]: OriginalPath }
  const importAliasMap = {}

  // Load tsconfig option
  // MEMO: tscとか使って簡単に読める方法がありそう
  try {
    const tsConfigFile = fs.readFileSync(path.join(process.cwd(), '/tsconfig.json'), 'utf-8')
    // Exists ts config
    const tsConfig = JSON.parse(tsConfigFile)
    if (tsConfig.compilerOptions && tsConfig.compilerOptions.paths) {
      Object.keys(tsConfig.compilerOptions.paths).forEach((key) => {
        // FIXME: このlint ruleではimport先が存在するかチェックしておらず、複数のパスから正しい方を選択できないため[0]固定
        importAliasMap[key] = `${tsConfig.compilerOptions.baseUrl ? `${tsConfig.compilerOptions.baseUrl.replace(/^(\.\/)?(.+?)\/?$/, '$2')}/` : ''}${tsConfig.compilerOptions.paths[key][0]}`
      })
    }
  } catch (e) {
    // DO NOTHING
  }

  if (importPath.startsWith('./') || importPath.startsWith('../')) {
    importPath = path.join(path.dirname(relativeFilePath), importPath)
  }

  return Object.keys(importAliasMap).reduce((resolvedImportPath, key) => {
    // FIXME: use glob module instead of replace('*')
    return resolvedImportPath.replace(key.replace('*', ''), importAliasMap[key].replace('*', ''))
  }, importPath)
}
