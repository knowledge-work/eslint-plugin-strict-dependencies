const resolveImportPath = require('../strict-dependencies/resolveImportPath')
const {readFileSync} = require('fs')

jest.mock('fs')

describe('resolveImportPath', () => {
  it('should resolve relative path', () => {
    // > src/pages/aaa/bbb.ts
    // import Text from '../../components/ui/Text'

    readFileSync.mockReturnValue(JSON.stringify({}))
    expect(resolveImportPath('../../components/ui/Text')).toBe('src/components/ui/Text')
  })

  it('should do nothing if tsconfig.json does not exist', () => {
    readFileSync.mockImplementation(() => {
      throw new Error()
    })
    expect(resolveImportPath('components/aaa/bbb')).toBe('components/aaa/bbb')
  })

  it('should do nothing if no paths setting', () => {
    readFileSync.mockReturnValue(JSON.stringify({}))
    expect(resolveImportPath('components/aaa/bbb')).toBe('components/aaa/bbb')
  })

  it('should resolve tsconfig paths', () => {
    readFileSync.mockReturnValue(JSON.stringify({
      compilerOptions: {
        paths: {
          '@/components/': ['components/'],
        },
      },
    }))

    expect(resolveImportPath('components/aaa/bbb')).toBe('components/aaa/bbb')
    expect(resolveImportPath('@/components/aaa/bbb')).toBe('components/aaa/bbb')
  })

  describe('should resolve tsconfig paths with baseUrl', () => {
    ['src', './src', 'src/'].forEach(baseUrl => {
      it(baseUrl, () => {
        readFileSync.mockReturnValue(JSON.stringify({
          compilerOptions: {
            baseUrl,
            paths: {
              '@/components/': ['components/'],
            },
          },
        }))

        expect(resolveImportPath('components/aaa/bbb')).toBe('components/aaa/bbb')
        expect(resolveImportPath('@/components/aaa/bbb')).toBe('src/components/aaa/bbb')
      })
    })
  })
})
