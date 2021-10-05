const {create} = require('../strict-dependencies')
const path = require('path')
const resolveImportPath = require('../strict-dependencies/resolveImportPath')

jest.mock('../strict-dependencies/resolveImportPath')

describe('create', () => {
  it('should return object', () => {
    const created = create({options: [[]]})
    expect(typeof created).toBe('object')
    expect(created).toHaveProperty('ImportDeclaration')
  })
})

describe('create.ImportDeclaration', () => {
  it('should do nothing if no dependencies', () => {
    resolveImportPath.mockReturnValue('src/components/ui/Text')
    const getFilename = jest.fn(() => path.join(process.cwd(), 'src/components/aaa/bbb.ts'))
    const report = jest.fn()
    const {ImportDeclaration: checkImport} = create({
      options: [[]],
      getFilename,
      report,
    })

    checkImport({source: {value: '@/components/ui/Text'}})

    expect(getFilename).toBeCalledTimes(1)
    expect(report).not.toBeCalled()
  })

  it('should do nothing if not matched with importPath', () => {
    // importPath: src/components/ui/Text
    // dependency.module: src/libs

    resolveImportPath.mockReturnValue('src/components/ui/Text')
    const getFilename = jest.fn(() => path.join(process.cwd(), 'src/components/aaa/bbb.ts'))
    const report = jest.fn()
    const {ImportDeclaration: checkImport} = create({
      options: [
        [{module: 'src/libs'}],
      ],
      getFilename,
      report,
    })

    checkImport({source: {value: '@/components/ui/Tex'}})

    expect(getFilename).toBeCalledTimes(1)
    expect(report).not.toBeCalled()
  })

  it('should not report if allowed', () => {
    // relativePath: src/components/pages/aaa.ts
    // importPath: src/components/ui/Text
    // dependency.module: src/components/ui, dependency.allowReferenceFrom: ['src/components/pages'], allowSameModule: true

    resolveImportPath.mockReturnValue('src/components/ui/Text')
    const getFilename = jest.fn(() => path.join(process.cwd(), 'src/components/pages/aaa.ts'))
    const report = jest.fn()
    const {ImportDeclaration: checkImport} = create({
      options: [
        [{module: 'src/components/ui', allowReferenceFrom: ['src/components/pages'], allowSameModule: true}],
      ],
      getFilename,
      report,
    })

    checkImport({source: {value: '@/components/ui/Text'}})

    expect(getFilename).toBeCalledTimes(1)
    expect(report).not.toBeCalled()
  })

  it('should not report if allowed with glob pattern', () => {
    // relativePath: src/components/pages/aaa.ts
    // importPath: src/components/ui/Text
    // dependency.module: src/components/ui, dependency.allowReferenceFrom: ['src/components/**/*.ts'], allowSameModule: true

    resolveImportPath.mockReturnValue('src/components/ui/Text')
    const getFilename = jest.fn(() => path.join(process.cwd(), 'src/components/pages/aaa.ts'))
    const report = jest.fn()
    const {ImportDeclaration: checkImport} = create({
      options: [
        [{module: 'src/components/ui', allowReferenceFrom: ['src/components/**/*.ts'], allowSameModule: true}],
      ],
      getFilename,
      report,
    })

    checkImport({source: {value: '@/components/ui/Text'}})

    expect(getFilename).toBeCalledTimes(1)
    expect(report).not.toBeCalled()
  })

  it('should report if not allowed', () => {
    // relativePath: src/components/test/aaa.ts
    // importPath: src/components/ui/Text
    // dependency.module: src/components/ui, dependency.allowReferenceFrom: ['src/components/pages'], allowSameModule: true

    resolveImportPath.mockReturnValue('src/components/ui/Text')
    const getFilename = jest.fn(() => path.join(process.cwd(), 'src/components/test/aaa.ts'))
    const report = jest.fn()
    const {ImportDeclaration: checkImport} = create({
      options: [
        [{module: 'src/components/ui', allowReferenceFrom: ['src/components/pages'], allowSameModule: true}],
      ],
      getFilename,
      report,
    })

    checkImport({source: {value: '@/components/ui/Text'}})

    expect(getFilename).toBeCalledTimes(1)
    expect(report.mock.calls).toHaveLength(1)
    expect(report.mock.calls[0][1]).toBe('import \'src/components/ui/Text\' is not allowed from src/components/test/aaa.ts.')
  })

  it('should report if not allowed with glob pattern', () => {
    // relativePath: src/components/test/aaa.tsx
    // importPath: src/components/ui/Text
    // dependency.module: src/components/ui, dependency.allowReferenceFrom: ['src/components/**/*.ts'], allowSameModule: true

    resolveImportPath.mockReturnValue('src/components/ui/Text')
    const getFilename = jest.fn(() => path.join(process.cwd(), 'src/components/test/aaa.tsx'))
    const report = jest.fn()
    const {ImportDeclaration: checkImport} = create({
      options: [
        [{module: 'src/components/ui', allowReferenceFrom: ['src/components/**/*.ts'], allowSameModule: true}],
      ],
      getFilename,
      report,
    })

    checkImport({source: {value: '@/components/ui/Text'}})

    expect(getFilename).toBeCalledTimes(1)
    expect(report.mock.calls).toHaveLength(1)
    expect(report.mock.calls[0][1]).toBe('import \'src/components/ui/Text\' is not allowed from src/components/test/aaa.tsx.')
  })

  it('should not report if allowed from same module', () => {
    // relativePath: src/components/pages/aaa.ts
    // importPath: src/components/ui/Text
    // dependency.module: src/components/ui, dependency.allowReferenceFrom: ['src/components/pages'], allowSameModule: true

    resolveImportPath.mockReturnValue('src/components/ui/Text')
    const getFilename = jest.fn(() => path.join(process.cwd(), 'src/components/ui/aaa.ts'))
    const report = jest.fn()
    const {ImportDeclaration: checkImport} = create({
      options: [
        [{module: 'src/components/ui', allowReferenceFrom: ['src/aaa'], allowSameModule: true}],
      ],
      getFilename,
      report,
    })

    checkImport({source: {value: '@/components/ui/Text'}})

    expect(getFilename).toBeCalledTimes(1)
    expect(report).not.toBeCalled()
  })

  it('should report if not allowed from same module', () => {
    // relativePath: src/components/pages/aaa.ts
    // importPath: src/components/ui/Text
    // dependency.module: src/components/ui, dependency.allowReferenceFrom: ['src/components/pages'], allowSameModule: true

    resolveImportPath.mockReturnValue('src/components/ui/Text')
    const getFilename = jest.fn(() => path.join(process.cwd(), 'src/components/ui/aaa.ts'))
    const report = jest.fn()
    const {ImportDeclaration: checkImport} = create({
      options: [
        [{module: 'src/components/ui', allowReferenceFrom: ['src/aaa'], allowSameModule: false}],
      ],
      getFilename,
      report,
    })

    checkImport({source: {value: '@/components/ui/Text'}})

    expect(getFilename).toBeCalledTimes(1)
    expect(report.mock.calls).toHaveLength(1)
    expect(report.mock.calls[0][1]).toBe('import \'src/components/ui/Text\' is not allowed from src/components/ui/aaa.ts.')
  })

  it('should pass relativeFilePath value to resolveImportPath if resolveRelativeImport is true', () => {
    resolveImportPath.mockReturnValue('src/components/ui/Text')
    const getFilename = jest.fn(() => path.join(process.cwd(), 'src/components/ui/aaa.ts'))
    const report = jest.fn()
    const {ImportDeclaration: checkImport} = create({
      options: [
        [{module: 'src/components/ui', allowReferenceFrom: ['src/aaa'], allowSameModule: true}],
        {resolveRelativeImport: true},
      ],
      getFilename,
      report,
    })

    checkImport({source: {value: '@/components/ui/Text'}})

    expect(resolveImportPath).toBeCalledWith('@/components/ui/Text', 'src/components/ui/aaa.ts')
    expect(getFilename).toBeCalledTimes(1)
    expect(report).not.toBeCalled()
  })

  it('should pass empty relativeFilePath value to resolveImportPath if resolveRelativeImport is false', () => {
    resolveImportPath.mockReturnValue('../components/ui/Text')
    const getFilename = jest.fn(() => path.join(process.cwd(), 'src/components/ui/aaa.ts'))
    const report = jest.fn()
    const {ImportDeclaration: checkImport} = create({
      options: [
        [{module: 'src/components/ui', allowReferenceFrom: ['src/aaa'], allowSameModule: true}],
      ],
      getFilename,
      report,
    })

    checkImport({source: {value: '@/components/ui/Text'}})

    expect(resolveImportPath).toBeCalledWith('@/components/ui/Text', null)
    expect(getFilename).toBeCalledTimes(1)
    expect(report).not.toBeCalled()
  })
})
