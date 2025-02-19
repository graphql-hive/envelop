# @envelop/graphql-jit

## 8.0.4

### Patch Changes

- [#2327](https://github.com/n1ru4l/envelop/pull/2327)
  [`b7dc96a`](https://github.com/n1ru4l/envelop/commit/b7dc96abd58f71984e372439ab62e0bd11215273)
  Thanks [@renovate](https://github.com/apps/renovate)! - dependencies updates:
  - Updated dependency [`graphql-jit@0.8.7` ↗︎](https://www.npmjs.com/package/graphql-jit/v/0.8.7)
    (from `0.8.6`, in `dependencies`)

## 8.0.3

### Patch Changes

- [#2188](https://github.com/n1ru4l/envelop/pull/2188)
  [`3a32aa9`](https://github.com/n1ru4l/envelop/commit/3a32aa977fcf3bc9c0e3416901deadd7c2f49582)
  Thanks [@renovate](https://github.com/apps/renovate)! - dependencies updates:

  - Updated dependency [`graphql-jit@0.8.6` ↗︎](https://www.npmjs.com/package/graphql-jit/v/0.8.6)
    (from `0.8.5`, in `dependencies`)

## 8.0.2

### Patch Changes

- [#2177](https://github.com/n1ru4l/envelop/pull/2177)
  [`dded74e`](https://github.com/n1ru4l/envelop/commit/dded74eb630f5537ef4af9b00afba1f307b28d20)
  Thanks [@renovate](https://github.com/apps/renovate)! - dependencies updates:

  - Updated dependency [`graphql-jit@0.8.5` ↗︎](https://www.npmjs.com/package/graphql-jit/v/0.8.5)
    (from `0.8.2`, in `dependencies`)

## 8.0.1

### Patch Changes

- [`27c0f705`](https://github.com/n1ru4l/envelop/commit/27c0f705d5369cd8f8656a267cdc9e3207734360)
  Thanks [@ardatan](https://github.com/ardatan)! - Downgrade graphql-jit to the latest working
  version

## 8.0.0

### Major Changes

- [#1986](https://github.com/n1ru4l/envelop/pull/1986)
  [`68e7a2a5`](https://github.com/n1ru4l/envelop/commit/68e7a2a59a2f9872652b4bae28f30c3a2fb70487)
  Thanks [@EmrysMyrddin](https://github.com/EmrysMyrddin)! - **Breaking Change:** Support of Node 16
  is dropped.

- Updated dependencies
  [[`68e7a2a5`](https://github.com/n1ru4l/envelop/commit/68e7a2a59a2f9872652b4bae28f30c3a2fb70487),
  [`f7ef03c0`](https://github.com/n1ru4l/envelop/commit/f7ef03c07ae1af3abf08de86bc95fe626bbc7913)]:
  - @envelop/core@5.0.0

### Patch Changes

- [#1999](https://github.com/n1ru4l/envelop/pull/1999)
  [`aba3c5c6`](https://github.com/n1ru4l/envelop/commit/aba3c5c601f861b51c3ebe52ba379140622018ed)
  Thanks [@renovate](https://github.com/apps/renovate)! - dependencies updates:

  - Updated dependency [`graphql-jit@0.8.4` ↗︎](https://www.npmjs.com/package/graphql-jit/v/0.8.4)
    (from `0.8.2`, in `dependencies`)

## 7.0.0

### Major Changes

- [#1992](https://github.com/n1ru4l/envelop/pull/1992)
  [`a07b2955`](https://github.com/n1ru4l/envelop/commit/a07b2955e37f261f96f30ca1cfb1f6d07179fb9b)
  Thanks [@ardatan](https://github.com/ardatan)! - Do not create LRU cache by default, use a cache
  only if provided

### Patch Changes

- [#1992](https://github.com/n1ru4l/envelop/pull/1992)
  [`a07b2955`](https://github.com/n1ru4l/envelop/commit/a07b2955e37f261f96f30ca1cfb1f6d07179fb9b)
  Thanks [@ardatan](https://github.com/ardatan)! - dependencies updates:

  - Updated dependency [`graphql-jit@0.8.2` ↗︎](https://www.npmjs.com/package/graphql-jit/v/0.8.2)
    (from `^0.8.0`, in `dependencies`)
  - Added dependency
    [`value-or-promise@^1.0.12` ↗︎](https://www.npmjs.com/package/value-or-promise/v/1.0.12) (to
    `dependencies`)
  - Removed dependency [`lru-cache@^10.0.0` ↗︎](https://www.npmjs.com/package/lru-cache/v/10.0.0)
    (from `dependencies`)

## 6.0.5

### Patch Changes

- [#1964](https://github.com/n1ru4l/envelop/pull/1964)
  [`6f55fe9a`](https://github.com/n1ru4l/envelop/commit/6f55fe9a45f6f1c4f135b15c0a436f29082cc3f6)
  Thanks [@ardatan](https://github.com/ardatan)! - Provide a custom JSON serializer in `stringify`
  property so you can use it in your server implementation like;

  ```ts
  const result = await enveloped.execute(...);
  const resultInStr = result.stringify(result);
  ```

## 6.0.4

### Patch Changes

- [#1927](https://github.com/n1ru4l/envelop/pull/1927)
  [`e3c90116`](https://github.com/n1ru4l/envelop/commit/e3c9011640b73aaede4e5e472a5d45aab947165c)
  Thanks [@renovate](https://github.com/apps/renovate)! - dependencies updates:

  - Updated dependency
    [`@envelop/core@^4.0.2` ↗︎](https://www.npmjs.com/package/@envelop/core/v/4.0.2) (from
    `^4.0.1`, in `peerDependencies`)

- Updated dependencies
  [[`dee6b8d2`](https://github.com/n1ru4l/envelop/commit/dee6b8d215f21301660090037b6685e86d217593)]:
  - @envelop/core@4.0.3

## 6.0.3

### Patch Changes

- Updated dependencies
  [[`db20864a`](https://github.com/n1ru4l/envelop/commit/db20864aac3fcede3e265ae63b2e8cb4664ba23a)]:
  - @envelop/core@4.0.2

## 6.0.2

### Patch Changes

- Updated dependencies []:
  - @envelop/core@4.0.1

## 6.0.1

### Patch Changes

- [#1879](https://github.com/n1ru4l/envelop/pull/1879)
  [`d3ecee35`](https://github.com/n1ru4l/envelop/commit/d3ecee350883eabd99fd9fe4fa58c72a616cc6b5)
  Thanks [@renovate](https://github.com/apps/renovate)! - dependencies updates:

  - Updated dependency [`lru-cache@^10.0.0` ↗︎](https://www.npmjs.com/package/lru-cache/v/10.0.0)
    (from `^9.1.1`, in `dependencies`)

## 6.0.0

### Major Changes

- [#1776](https://github.com/n1ru4l/envelop/pull/1776)
  [`332f1f22`](https://github.com/n1ru4l/envelop/commit/332f1f221f655421a850adb834afe549d50b4fac)
  Thanks [@ardatan](https://github.com/ardatan)! - Drop Node 14 and require Node 16 or higher

- [#1767](https://github.com/n1ru4l/envelop/pull/1767)
  [`0b127cc4`](https://github.com/n1ru4l/envelop/commit/0b127cc40f2e6a003a05cbeb0b6f004a08ada9d2)
  Thanks [@n1ru4l](https://github.com/n1ru4l)! - bump lru cache dependency version

- Updated dependencies
  [[`332f1f22`](https://github.com/n1ru4l/envelop/commit/332f1f221f655421a850adb834afe549d50b4fac),
  [`a36925c7`](https://github.com/n1ru4l/envelop/commit/a36925c7df0538f88b51682e4e23f4b16f6fae2b)]:
  - @envelop/core@4.0.0

### Patch Changes

- [#1767](https://github.com/n1ru4l/envelop/pull/1767)
  [`0b127cc4`](https://github.com/n1ru4l/envelop/commit/0b127cc40f2e6a003a05cbeb0b6f004a08ada9d2)
  Thanks [@n1ru4l](https://github.com/n1ru4l)! - dependencies updates:

  - Updated dependency [`lru-cache@^9.1.1` ↗︎](https://www.npmjs.com/package/lru-cache/v/9.1.1)
    (from `^6.0.0`, in `dependencies`)

- [#1728](https://github.com/n1ru4l/envelop/pull/1728)
  [`a36925c7`](https://github.com/n1ru4l/envelop/commit/a36925c7df0538f88b51682e4e23f4b16f6fae2b)
  Thanks [@ardatan](https://github.com/ardatan)! - - Memoize parsed document string result and use
  it wherever possible, and export `getDocumentString` function to allow users to use it as well.
  - Use `WeakMap`s with `DocumentNode` wherever possible instead of using LRU Cache with strings. It
    is more optimal if a parser caching is used

## 5.0.6

### Patch Changes

- [#1725](https://github.com/n1ru4l/envelop/pull/1725)
  [`c1eb2c09`](https://github.com/n1ru4l/envelop/commit/c1eb2c09ac535b076a5c13430c3892d98f7ef957)
  Thanks [@n1ru4l](https://github.com/n1ru4l)! - dependencies updates:

  - Updated dependency [`tslib@^2.5.0` ↗︎](https://www.npmjs.com/package/tslib/v/2.5.0) (from
    `^2.4.0`, in `dependencies`)

- Updated dependencies
  [[`c1eb2c09`](https://github.com/n1ru4l/envelop/commit/c1eb2c09ac535b076a5c13430c3892d98f7ef957)]:
  - @envelop/core@3.0.6

## 5.0.5

### Patch Changes

- [#1633](https://github.com/n1ru4l/envelop/pull/1633)
  [`b581fddd`](https://github.com/n1ru4l/envelop/commit/b581fddd71c2fc882925a4e2a1124540065a0b1a)
  Thanks [@jeengbe](https://github.com/jeengbe)! - Update `graphql-jit` for supporting `@include`
  and `@skip` directives.

- Updated dependencies
  [[`270249cf`](https://github.com/n1ru4l/envelop/commit/270249cfb7650f8ad64f0167bb45a99475a03b04)]:
  - @envelop/core@3.0.5

## 5.0.4

### Patch Changes

- Updated dependencies []:
  - @envelop/core@3.0.4

## 5.0.3

### Patch Changes

- Updated dependencies
  [[`6b48ef96`](https://github.com/n1ru4l/envelop/commit/6b48ef962020eb7dfd2918626b8a394bff673e4f)]:
  - @envelop/core@3.0.3

## 5.0.2

### Patch Changes

- Updated dependencies
  [[`22f5ccfb`](https://github.com/n1ru4l/envelop/commit/22f5ccfbe69eb052cda6c1908425b63e3d906243)]:
  - @envelop/core@3.0.2

## 5.0.0

### Major Changes

- Updated dependencies
  [[`dc1e24b5`](https://github.com/n1ru4l/envelop/commit/dc1e24b5340ed7eba300a702b17f9be5cff65a8f),
  [`dc1e24b5`](https://github.com/n1ru4l/envelop/commit/dc1e24b5340ed7eba300a702b17f9be5cff65a8f),
  [`dc1e24b5`](https://github.com/n1ru4l/envelop/commit/dc1e24b5340ed7eba300a702b17f9be5cff65a8f),
  [`dc1e24b5`](https://github.com/n1ru4l/envelop/commit/dc1e24b5340ed7eba300a702b17f9be5cff65a8f),
  [`dc1e24b5`](https://github.com/n1ru4l/envelop/commit/dc1e24b5340ed7eba300a702b17f9be5cff65a8f),
  [`dc1e24b5`](https://github.com/n1ru4l/envelop/commit/dc1e24b5340ed7eba300a702b17f9be5cff65a8f),
  [`dc1e24b5`](https://github.com/n1ru4l/envelop/commit/dc1e24b5340ed7eba300a702b17f9be5cff65a8f),
  [`dc1e24b5`](https://github.com/n1ru4l/envelop/commit/dc1e24b5340ed7eba300a702b17f9be5cff65a8f),
  [`dc1e24b5`](https://github.com/n1ru4l/envelop/commit/dc1e24b5340ed7eba300a702b17f9be5cff65a8f),
  [`dc1e24b5`](https://github.com/n1ru4l/envelop/commit/dc1e24b5340ed7eba300a702b17f9be5cff65a8f),
  [`dc1e24b5`](https://github.com/n1ru4l/envelop/commit/dc1e24b5340ed7eba300a702b17f9be5cff65a8f),
  [`dc1e24b5`](https://github.com/n1ru4l/envelop/commit/dc1e24b5340ed7eba300a702b17f9be5cff65a8f),
  [`dc1e24b5`](https://github.com/n1ru4l/envelop/commit/dc1e24b5340ed7eba300a702b17f9be5cff65a8f),
  [`dc1e24b5`](https://github.com/n1ru4l/envelop/commit/dc1e24b5340ed7eba300a702b17f9be5cff65a8f)]:
  - @envelop/core@3.0.0

## 4.6.0

### Minor Changes

- [#1499](https://github.com/n1ru4l/envelop/pull/1499)
  [`1f7af02b`](https://github.com/n1ru4l/envelop/commit/1f7af02b9f1a16058a6d69fcd48425a93be655c6)
  Thanks [@viniciuspalma](https://github.com/viniciuspalma)! - Adding tslib to package dependencies

  Projects that currently are using yarn Berry with PnP or any strict dependency resolver, that
  requires that all dependencies are specified on package.json otherwise it would endue in an error
  if not treated correct

  Since https://www.typescriptlang.org/tsconfig#importHelpers is currently being used, tslib should
  be exported as a dependency to external runners get the proper import.

  Change on each package:

  ```json
  // package.json
  {
    "dependencies": {
      "tslib": "^2.4.0"
    }
  }
  ```

- Updated dependencies
  [[`1f7af02b`](https://github.com/n1ru4l/envelop/commit/1f7af02b9f1a16058a6d69fcd48425a93be655c6),
  [`ae7bc9a3`](https://github.com/n1ru4l/envelop/commit/ae7bc9a36abd595b0a91f7b4e133017d3eb99a4a)]:
  - @envelop/core@2.6.0

## 4.5.0

### Minor Changes

- Updated dependencies
  [[`5a5f5c04`](https://github.com/n1ru4l/envelop/commit/5a5f5c04177b9e1379fd77db5d6383160879d449),
  [`d828f129`](https://github.com/n1ru4l/envelop/commit/d828f1291254a0f9dfdc3654611087859e4c9708)]:
  - @envelop/core@2.5.0

## 4.4.2

### Patch Changes

- 071f946: Fix CommonJS TypeScript resolution with `moduleResolution` `node16` or `nodenext`
- Updated dependencies [071f946]
  - @envelop/core@2.4.2

## 4.4.1

### Patch Changes

- Updated dependencies [787d28a2]
  - @envelop/core@2.4.1

## 4.4.0

### Minor Changes

- 5d06ccc: Replace `tiny-lru` implementation with `lru-cache`.

## 4.3.0

### Minor Changes

- 8bb2738: Support TypeScript module resolution.
- Updated dependencies [8bb2738]
  - @envelop/core@2.4.0

## 4.2.3

### Patch Changes

- 0f56966: fix compatibility with other plugins that extend the context by using the correct
  execution args within the execute/subscribe implementation.
- fbf6155: update package.json repository links to point to the new home
- Updated dependencies [fbf6155]
  - @envelop/core@2.3.3

## 4.2.2

### Patch Changes

- Updated dependencies [07d029b]
  - @envelop/core@2.3.2

## 4.2.1

### Patch Changes

- Updated dependencies [d5c2c9a]
  - @envelop/core@2.3.1

## 4.2.0

### Minor Changes

- Updated dependencies [af23408]
  - @envelop/core@2.3.0

## 4.1.0

### Minor Changes

- Updated dependencies [ada7fb0]
- Updated dependencies [d5115b4]
- Updated dependencies [d5115b4]
  - @envelop/core@2.2.0

## 4.0.0

### Major Changes

- f8f8189: useGraphQlJit plugin: Remove `max` and `ttl` options, adding support for passing in a
  cache instance instead.

## 3.1.0

### Minor Changes

- Updated dependencies [78b3db2]
- Updated dependencies [f5eb436]
  - @envelop/core@2.1.0

## 3.0.0

### Patch Changes

- Updated dependencies [4106e08]
- Updated dependencies [aac65ef]
- Updated dependencies [4106e08]
  - @envelop/core@2.0.0

## 2.0.0

### Patch Changes

- Updated dependencies [d9cfb7c]
  - @envelop/core@1.7.0

## 1.3.1

### Patch Changes

- b1a0331: Properly list `@envelop/core` as a `peerDependency` in plugins.

  This resolves issues where the bundled envelop plugins published to npm had logic inlined from the
  `@envelop/core` package, causing `instanceof` check of `EnvelopError` to fail.

- Updated dependencies [b1a0331]
  - @envelop/core@1.6.1

## 1.3.0

### Minor Changes

- 090cae4: GraphQL v16 support

## 1.2.0

### Minor Changes

- 04120de: add support for GraphQL.js 16
- 3bb3df0: feat(graphql-jit): subscription support

## 1.1.1

### Patch Changes

- abae5a2: Allow `enableIf` to return Promise

## 1.1.0

### Minor Changes

- cc71515: Added `enableIf` config flag to allow flexibility on jit executor

## 1.0.0

### Major Changes

- 40bc444: v1 major release for envelop packages

## 0.2.1

### Patch Changes

- d82e2d0: Adjustments for new TypeScript beta version
- 28ad742: Improve TypeScript types

## 0.2.0

### Minor Changes

- eb6f53b: ESM Support for all plugins and envelop core

## 0.1.1

### Patch Changes

- e7f43f4: Fix issues with executor and caching

## 0.1.0

### Minor Changes

- 2fba0b4: Initial version bump

## 0.0.2

### Patch Changes

- b1333b0: Initial packages release
