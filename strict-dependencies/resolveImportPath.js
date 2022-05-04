/* eslint-disable */

const path = require('path')
const parseJSON = require('require-strip-json-comments')

/**
 * import文のrootからのパスを求める
 */
module.exports = (importPath, relativeFilePath) => {
  // { [importAlias: string]: OriginalPath }
  const importAliasMap = {}

  // Load tsconfig option
  // MEMO: tscとか使って簡単に読める方法がありそう
  try {
    const tsConfigFilePath = path.join(process.cwd(), '/tsconfig.json')
    // Exists ts config
    const tsConfig = parseJSON(tsConfigFilePath)
    if (tsConfig.compilerOptions && tsConfig.compilerOptions.paths) {
      Object.keys(tsConfig.compilerOptions.paths).forEach((key) => {
        // FIXME: このlint ruleではimport先が存在するかチェックしておらず、複数のパスから正しい方を選択できないため[0]固定
        importAliasMap[key] = tsConfig.compilerOptions.baseUrl ? path.join(tsConfig.compilerOptions.baseUrl, tsConfig.compilerOptions.paths[key][0]) : tsConfig.compilerOptions.paths[key][0]
      })
    }
  } catch (e) {
    // DO NOTHING
  }

  if (relativeFilePath && (importPath.startsWith('./') || importPath.startsWith('../'))) {
    importPath = path.join(path.dirname(relativeFilePath), importPath)
  }

  return Object.keys(importAliasMap).reduce((resolvedImportPath, key) => {
    // FIXME: use glob module instead of replace('*')
    return resolvedImportPath.replace(key.replace('*', ''), importAliasMap[key].replace('*', ''))
  }, importPath)
}
