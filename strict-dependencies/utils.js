/* eslint-disable */

const path = require('path')

/**
 * Convert backslashes to slashes, collapse duplicate slashes and remove a trailing slash.
 */
const normalizePath = (filePath) => {
  const normalized = filePath.replace(/[\\/]+/g, '/')
  return normalized.length > 1 && normalized.endsWith('/') ? normalized.slice(0, -1) : normalized
}

/**
 * Whether the pattern contains glob syntax (wildcards, character classes, braces or extglobs).
 * A lone `?` is not treated as glob syntax, as is-glob did.
 */
const isGlob = (pattern) => /[*[\]{}]|[!@+?]\(/.test(pattern)

/**
 * Glob patterns are matched with path.matchesGlob, other patterns are matched by prefix.
 * `dir/**` also matches `dir` itself, as micromatch did.
 */
const isMatch = (str, pattern) => {
  if (!isGlob(pattern)) return str.startsWith(pattern)
  if (pattern.endsWith('/**') && str === pattern.slice(0, -3)) return true
  return path.matchesGlob(str, pattern)
}

/**
 * Remove line and block comments from JSON text, leaving string literals untouched.
 */
const stripJsonComments = (text) => {
  let result = ''
  let inString = false
  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    const next = text[i + 1]
    if (inString) {
      result += char
      if (char === '\\') {
        result += next ?? ''
        i++
      } else if (char === '"') {
        inString = false
      }
      continue
    }
    if (char === '"') {
      inString = true
      result += char
    } else if (char === '/' && next === '/') {
      const end = text.indexOf('\n', i)
      i = end === -1 ? text.length : end - 1
    } else if (char === '/' && next === '*') {
      const end = text.indexOf('*/', i + 2)
      i = end === -1 ? text.length : end + 1
    } else {
      result += char
    }
  }
  return result
}

module.exports = { normalizePath, isGlob, isMatch, stripJsonComments }
