/* eslint-disable */

const fs = require('fs')
const path = require('path')

const { normalizePath, stripJsonComments } = require('./utils')

/**
 * Read a JSON file that may contain comments (such as tsconfig.json)
 */
const readJsonWithComments = (filePath) =>
  JSON.parse(stripJsonComments(fs.readFileSync(filePath, 'utf8').replace(/^﻿/, '')))

/**
 * import文のrootからのパスを求める
 */
const resolveImportPath = (importPath, relativeFilePath, pathIndexMap) => {
  // { [importAlias: string]: OriginalPath }
  const importAliasMap = {}

  // Load tsconfig option
  // MEMO: tscとか使って簡単に読める方法がありそう
  try {
    const tsConfigFilePath = path.join(process.cwd(), '/tsconfig.json')
    // Exists ts config
    const tsConfig = readJsonWithComments(tsConfigFilePath)
    if (tsConfig.compilerOptions && tsConfig.compilerOptions.paths) {
      Object.keys(tsConfig.compilerOptions.paths).forEach((key) => {
        const matchedKey = Object.keys(pathIndexMap).find(k => k === key)
        // MEMO: pathIndexMapの指定がない場合 or 指定されているindexにアクセスしても値が得られない場合は[0]固定
        const pathIndex = matchedKey ? pathIndexMap[matchedKey] : 0
        const pathValue = tsConfig.compilerOptions.paths[key][pathIndex] ? tsConfig.compilerOptions.paths[key][pathIndex] : tsConfig.compilerOptions.paths[key][0]
        // MEMO: TypeScript 7でbaseUrlが廃止されたため、baseUrl未指定時はtsconfig.jsonの場所(=baseUrl: ".")からの相対パスとして扱う
        importAliasMap[key] = path.join(tsConfig.compilerOptions.baseUrl || '.', pathValue)
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

  return normalizePath(absolutePath)
}

// Exported as an object so that tests can replace it with vi.spyOn
module.exports = { resolveImportPath }
