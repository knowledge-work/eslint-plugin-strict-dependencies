/* eslint-disable */

const path = require('path')
const parseJSON = require('require-strip-json-comments')
const normalize = require('normalize-path')

/**
 * import文のrootからのパスを求める
 */
module.exports = (importPath, relativeFilePath, pathIndexMap) => {
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
        const matchedKey = Object.keys(pathIndexMap).find(k => k === key)
        // MEMO: pathIndexMapの指定がない場合 or 指定されているindexにアクセスしても値が得られない場合は[0]固定
        const pathIndex = matchedKey ? pathIndexMap[matchedKey] : 0
        const pathValue = tsConfig.compilerOptions.paths[key][pathIndex] ? tsConfig.compilerOptions.paths[key][pathIndex] : tsConfig.compilerOptions.paths[key][0]
        importAliasMap[key] = tsConfig.compilerOptions.baseUrl ? path.join(tsConfig.compilerOptions.baseUrl, pathValue) : pathValue
      })
    }
  } catch (e) {
    // DO NOTHING
  }

  if (relativeFilePath && (importPath.startsWith('./') || importPath.startsWith('../'))) {
    importPath = path.join(path.dirname(relativeFilePath), importPath)
  }

  const absolutePath = Object.keys(importAliasMap).reduce((resolvedImportPath, key) => {
    // FIXME: use glob module instead of replace('*')
    return resolvedImportPath.replace(key.replace('*', ''), importAliasMap[key].replace('*', ''))
  }, importPath)

  return normalize(absolutePath)
}
