const {normalizePath, isGlob, isMatch, stripJsonComments} = require('../strict-dependencies/utils')

describe('normalizePath', () => {
  it.each([
    ['src\\components\\ui', 'src/components/ui'],
    ['src//components///ui', 'src/components/ui'],
    ['src/components/ui/', 'src/components/ui'],
    ['/', '/'],
    ['src', 'src'],
  ])('%s -> %s', (input, expected) => {
    expect(normalizePath(input)).toBe(expected)
  })
})

describe('isGlob', () => {
  it.each([
    ['src/components/**/*.ts', true],
    ['src/components/*', true],
    ['src/components/?.ts', false],
    ['src/components/*/?.ts', true],
    ['src/{a,b}', true],
    ['src/[ab]', true],
    ['src/!(a)', true],
    ['src/components', false],
    ['src/components/ui', false],
    ['@/components', false],
  ])('%s -> %s', (pattern, expected) => {
    expect(isGlob(pattern)).toBe(expected)
  })
})

describe('isMatch', () => {
  it('matches glob patterns', () => {
    expect(isMatch('src/components/aaa/bbb.ts', 'src/components/**/*.ts')).toBe(true)
    expect(isMatch('src/components/aaa/bbb.tsx', 'src/components/**/*.ts')).toBe(false)
    expect(isMatch('src/pages/aaa.ts', 'src/{pages,components}/*.ts')).toBe(true)
  })

  it('matches the base directory with dir/**', () => {
    expect(isMatch('src', 'src/**')).toBe(true)
    expect(isMatch('src/a/b.ts', 'src/**')).toBe(true)
    expect(isMatch('srcx', 'src/**')).toBe(false)
  })

  it('matches non-glob patterns by prefix', () => {
    expect(isMatch('src/components/ui/Text', 'src/components/ui')).toBe(true)
    expect(isMatch('src/components/pages/aaa.ts', 'src/components/ui')).toBe(false)
  })
})

describe('stripJsonComments', () => {
  it('removes line and block comments', () => {
    const text = `{
      // line comment
      "compilerOptions": {
        /* block
           comment */
        "baseUrl": "." // trailing comment
      }
    }`
    expect(JSON.parse(stripJsonComments(text))).toEqual({compilerOptions: {baseUrl: '.'}})
  })

  it('keeps comment-like text inside strings', () => {
    const text = '{"a": "http://example.com", "b": "/* not a comment */", "c": "quote \\" // still string"}'
    expect(JSON.parse(stripJsonComments(text))).toEqual({
      a: 'http://example.com',
      b: '/* not a comment */',
      c: 'quote " // still string',
    })
  })
})
