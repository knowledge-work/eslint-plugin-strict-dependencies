# eslint-plugin-strict-dependencies

NOTE: eslint-plugin-strict-dependencies uses tsconfig, tsconfig.json must be present.

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
    - Whether or not the target module itself can import on the target module

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
       * example:
       * Components only allow dependencies in the following directions
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
       * Don't import next/router directly, always import it through libs/router.
       */
      {
        "module": "next/router",
        "allowReferenceFrom": ["src/libs/router.ts"],
        "allowSameModule": false
      },
    ],
  ],
}

```


## License

MIT