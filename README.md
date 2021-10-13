# eslint-plugin-strict-dependencies

ESlint plugin to define custom module dependency rules.

NOTE: `eslint-plugin-strict-dependencies` uses tsconfig, tsconfig.json must be present.

## Installation

```
npm install eslint-plugin-strict-dependencies --save-dev
```

## Supported Rules

- strict-dependencies
  - module: `string` (Glob or Forward matching string)
    - target module path
  - allowReferenceFrom: `string[]` (Glob or Forward matching string)
    - Paths of files where target module imports are allowed.
  - allowSameModule: `boolean`
    - Whether it can be imported by other files in the same directory

### Options

- resolveRelativeImport: `boolean[default = false]`
  - Whether to resolve relative import as in the following example
  - `src/components/aaa.ts`
    ```typescript
    import bbb from './bbb';
    ```
     - `resolveRelativeImport = false`: Resolve as `./bbb` (excluded from lint target)
     - `resolveRelativeImport = true`:  Resolve as `src/components/bbb`: (included from lint target)

## Usage

.eslintrc:

```js
"plugins": [
  "strict-dependencies",
],
"rules": {
  "strict-dependencies/strict-dependencies": [
    "error",
    [
      /**
       * Example:
       * Limit the dependencies in the following directions
       * pages -> components/page -> components/ui
       */
      {
        "module": "src/components/page",
        "allowReferenceFrom": ["src/pages"],
        // components/page can't import other components/page
        "allowSameModule": false
      },
      {
        "module": "src/components/ui",
        "allowReferenceFrom": ["src/components/page"],
        // components/ui can import other components/ui
        "allowSameModule": true
      },

      /**
       * example:
       * Disallow to import `next/router` directly. it should always be imported using `libs/router.ts`.
       */
      {
        "module": "next/router",
        "allowReferenceFrom": ["src/libs/router.ts"],
        "allowSameModule": false
      },
    ],
    // options
    // {
    //   "resolveRelativeImport": true
    // }
  ]
}

```


## License

MIT
