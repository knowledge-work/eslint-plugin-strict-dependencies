const resolveImportPath = require('../strict-dependencies/resolveImportPath')
const { readFileSync } = require('fs')
const path = require('path')

jest.mock('fs')

describe('resolveImportPath', () => {
  it('should resolve relative path', () => {
    // > src/pages/aaa/bbb.ts
    // import Text from '../../components/ui/Text'

    readFileSync.mockReturnValue(JSON.stringify({}))
    expect(
      resolveImportPath(
        '../../components/ui/Text',
        'src/pages/aaa/bbb.ts',
        {},
        undefined
      )
    ).toBe('src/components/ui/Text')
  })

  it('should not resolve relative path if relativeFilePath is empty', () => {
    // > src/pages/aaa/bbb.ts
    // import Text from '../../components/ui/Text'

    readFileSync.mockReturnValue(JSON.stringify({}))
    expect(
      resolveImportPath('../../components/ui/Text', null, {}, undefined)
    ).toBe('../../components/ui/Text')
  })

  it('should do nothing if tsconfig.json does not exist', () => {
    readFileSync.mockImplementation(() => {
      throw new Error()
    })
    expect(resolveImportPath('components/aaa/bbb', null, {}, undefined)).toBe(
      'components/aaa/bbb'
    )
  })

  it('should do nothing if no paths setting', () => {
    readFileSync.mockReturnValue(JSON.stringify({}))
    expect(resolveImportPath('components/aaa/bbb', null, {}, undefined)).toBe(
      'components/aaa/bbb'
    )
  })

  describe('should resolve tsconfig paths', () => {
    ;[
      ['@/components/', 'components/', 'components/aaa/bbb'],
      ['@/components', 'components', 'components/aaa/bbb'],
      ['@/components/*', 'components/*', 'components/aaa/bbb'],
    ].forEach(([target, resolve, expected]) => {
      it(`${target}: [${resolve}]`, () => {
        readFileSync.mockReturnValue(
          JSON.stringify({
            compilerOptions: {
              paths: {
                [target]: [resolve],
              },
            },
          })
        )

        expect(
          resolveImportPath('components/aaa/bbb', null, {}, undefined)
        ).toBe('components/aaa/bbb')
        expect(
          resolveImportPath('@/components/aaa/bbb', null, {}, undefined)
        ).toBe(expected)
      })
    })
  })

  describe('should resolve tsconfig paths with baseUrl', () => {
    ;[
      ['.', 'components/aaa/bbb'],
      ['./', 'components/aaa/bbb'],
      ['../', '../components/aaa/bbb'],
      ['src', 'src/components/aaa/bbb'],
      ['./src', 'src/components/aaa/bbb'],
      ['src/', 'src/components/aaa/bbb'],
      ['./src/', 'src/components/aaa/bbb'],
    ].forEach(([baseUrl, expected]) => {
      it(baseUrl, () => {
        readFileSync.mockReturnValue(
          JSON.stringify({
            compilerOptions: {
              baseUrl,
              paths: {
                '@/components/': ['components/'],
              },
            },
          })
        )

        expect(
          resolveImportPath('components/aaa/bbb', null, {}, undefined)
        ).toBe('components/aaa/bbb')
        expect(
          resolveImportPath('@/components/aaa/bbb', null, {}, undefined)
        ).toBe(expected)
      })
    })
  })

  describe('resolveImportPath with pathIndexMap parameter', () => {
    const tsConfigWithMultiplePaths = JSON.stringify({
      compilerOptions: {
        paths: {
          '@/components/*': ['src/components/*', 'src/alternativeComponents/*'],
        },
      },
    })

    it('should resolve path alias with specified index in pathIndexMap', () => {
      readFileSync.mockReturnValue(tsConfigWithMultiplePaths)
      expect(
        resolveImportPath(
          '@/components/aaa/bbb',
          null,
          { '@/components/*': 1 },
          undefined
        )
      ).toBe('src/alternativeComponents/aaa/bbb')
    })

    it('should resolve path alias with default index:0 if specified index does not exist', () => {
      readFileSync.mockReturnValue(tsConfigWithMultiplePaths)
      expect(
        resolveImportPath(
          '@/components/aaa/bbb',
          null,
          { '@/components/*': 5 },
          undefined
        )
      ).toBe('src/components/aaa/bbb')
    })

    it('should resolve path alias with default index:0 if pathIndexMap is an empty object', () => {
      readFileSync.mockReturnValue(tsConfigWithMultiplePaths)
      expect(
        resolveImportPath('@/components/aaa/bbb', null, {}, undefined)
      ).toBe('src/components/aaa/bbb')
    })
  })

  describe('resolveImportPath with tsconfigPath parameter', () => {
    beforeEach(() => {
      readFileSync.mockClear()
    })

    it('should use custom tsconfigPath when specified', () => {
      const customTsConfig = JSON.stringify({
        compilerOptions: {
          paths: {
            '@/libs/*': ['src/libs/*'],
          },
        },
      })
      readFileSync.mockImplementation((filePath) => {
        if (filePath.endsWith('tsconfig.app.json')) {
          return customTsConfig
        }
        return JSON.stringify({})
      })

      const result = resolveImportPath(
        '@/libs/utils',
        null,
        {},
        'tsconfig.app.json'
      )
      expect(result).toBe('src/libs/utils')
    })

    it('should use default tsconfig.json when tsconfigPath is not provided', () => {
      const defaultTsConfig = JSON.stringify({
        compilerOptions: {
          paths: {
            '@/shared/*': ['src/shared/*'],
          },
        },
      })
      readFileSync.mockImplementation((filePath) => {
        if (filePath.endsWith('tsconfig.json')) {
          return defaultTsConfig
        }
        return JSON.stringify({})
      })

      const result = resolveImportPath('@/shared/constants', null, {})
      expect(result).toBe('src/shared/constants')
    })

    it('should handle custom tsconfigPath with different file name', () => {
      const baseTsConfig = JSON.stringify({
        compilerOptions: {
          baseUrl: 'src',
          paths: {
            '@/components/*': ['components/*'],
          },
        },
      })
      readFileSync.mockImplementation((filePath) => {
        if (filePath.endsWith('tsconfig.base.json')) {
          return baseTsConfig
        }
        return JSON.stringify({})
      })

      const result = resolveImportPath(
        '@/components/Button',
        null,
        {},
        'tsconfig.base.json'
      )
      expect(result).toBe('src/components/Button')
    })

    it('should handle different tsconfig files with different paths', () => {
      const appTsConfig = JSON.stringify({
        compilerOptions: {
          paths: {
            '@/app/*': ['src/app/*'],
          },
        },
      })
      const baseTsConfig = JSON.stringify({
        compilerOptions: {
          paths: {
            '@/base/*': ['src/base/*'],
          },
        },
      })
      readFileSync.mockImplementation((filePath) => {
        if (filePath.endsWith('tsconfig.app.json')) {
          return appTsConfig
        }
        if (filePath.endsWith('tsconfig.base.json')) {
          return baseTsConfig
        }
        return JSON.stringify({})
      })

      const appResult = resolveImportPath(
        '@/app/main',
        null,
        {},
        'tsconfig.app.json'
      )
      expect(appResult).toBe('src/app/main')

      const baseResult = resolveImportPath(
        '@/base/core',
        null,
        {},
        'tsconfig.base.json'
      )
      expect(baseResult).toBe('src/base/core')
    })
  })
})
