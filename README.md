# eslint-plugin-strict-dependencies

ESLint plugin to define custom module dependency rules.

## Requirements

- Node.js `^22.17.0 || >=24.8.0`
- ESLint

This plugin has no runtime dependencies.

## Installation

```sh
npm install --save-dev eslint-plugin-strict-dependencies
# or
pnpm add --save-dev eslint-plugin-strict-dependencies
```

## Supported Rules

### `strict-dependencies`

The first option is a list of dependency rules.

- `module`: `string` (glob or prefix)
  - Target module path
- `targetMembers`: `string[]`
  - Target member names
  - e.g. `["Suspense"]` in `import { Suspense } from 'react'`
- `allowReferenceFrom`: `string[]` (glob or prefix)
  - Paths of files where target module imports are allowed
- `allowSameModule`: `boolean`
  - Whether files inside the target module can import it
- `excludeTypeImportChecks`: `boolean`
  - Whether to exclude type imports from the check
  - e.g. `import type { Suspense } from 'react'`

Paths are relative to the directory where ESLint runs. A pattern that contains glob syntax (such as `*` or `{a,b}`) is matched with [`path.matchesGlob`](https://nodejs.org/api/path.html#pathmatchesglobpath-pattern), and any other pattern is matched as a prefix.

If `tsconfig.json` exists in that directory, import paths are resolved with its `compilerOptions.paths`.

### Options

The second option is an object.

- `resolveRelativeImport`: `boolean` (default: `false`)
  - Whether to resolve relative imports, as in the following example
  - `src/components/aaa.ts`
    ```ts
    import bbb from "./bbb";
    ```
    - `resolveRelativeImport: false`: resolved as `./bbb` (not checked)
    - `resolveRelativeImport: true`: resolved as `src/components/bbb` (checked)
- `pathIndexMap`: `object` (default: `{}`)
  - Each path alias in `compilerOptions.paths` uses its first path by default. Set the index to use another one.
  - `tsconfig.json`
    ```json
    {
      "compilerOptions": {
        "paths": {
          "*": ["aaa/*", "bbb/*"]
        }
      }
    }
    ```
  - `pathIndexMap: { "*": 1 }`: `"bbb/*"` is used.

## Usage

### Flat config (`eslint.config.js`)

```js
import strictDependencies from "eslint-plugin-strict-dependencies";

export default [
  {
    plugins: {
      "strict-dependencies": strictDependencies,
    },
    rules: {
      "strict-dependencies/strict-dependencies": [
        "error",
        [
          /**
           * Limit the dependencies in the following directions:
           * pages -> components/page -> components/ui
           */
          {
            module: "src/components/page",
            allowReferenceFrom: ["src/pages"],
            // components/page can't import other components/page
            allowSameModule: false,
          },
          {
            module: "src/components/ui",
            allowReferenceFrom: ["src/components/page"],
            // components/ui can import other components/ui
            allowSameModule: true,
            // Type imports of components/ui are not checked
            excludeTypeImportChecks: true,
          },

          /**
           * Disallow importing `next/router` directly. Import it from `src/libs/router.ts` instead.
           */
          {
            module: "next/router",
            allowReferenceFrom: ["src/libs/router.ts"],
            allowSameModule: false,
          },

          /**
           * Disallow importing `Suspense` from react. Import it from `src/libs/react.ts` instead.
           */
          {
            module: "react",
            targetMembers: ["Suspense"],
            allowReferenceFrom: ["src/libs/react.ts"],
            allowSameModule: false,
          },
        ],
        // Options
        // {
        //   resolveRelativeImport: true,
        //   pathIndexMap: { "*": 1 },
        // },
      ],
    },
  },
];
```

### Legacy config (`.eslintrc`)

```json
{
  "plugins": ["strict-dependencies"],
  "rules": {
    "strict-dependencies/strict-dependencies": [
      "error",
      [
        {
          "module": "src/components/ui",
          "allowReferenceFrom": ["src/components/page"],
          "allowSameModule": true
        }
      ],
      { "resolveRelativeImport": true }
    ]
  }
}
```

## Development

Requires pnpm (see `packageManager` in `package.json`). pnpm installs the Node.js version in `devEngines.runtime` and runs the scripts with it. Use pnpm instead of npm in this repository.

```sh
pnpm install
pnpm test   # Vitest with coverage
```

## Release

The [Publish](.github/workflows/publish.yml) workflow publishes to npm with `pnpm publish --provenance` and [trusted publishing](https://docs.npmjs.com/trusted-publishers).

- It runs on the 15th of every month (patch release), or manually from the Actions tab with `patch`, `minor`, or `major`.
- The job runs in the `npm` environment and waits for approval before publishing.
- It bumps the version, publishes the package, pushes the version commit and tag, and creates a GitHub release.

## License

MIT
