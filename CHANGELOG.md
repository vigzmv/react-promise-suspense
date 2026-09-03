# Changelog

All notable changes to this project are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.4.0]

### Fixed

- **Cache identity now includes the promise function** ([#8]). Two different
  promise functions called with deeply equal `inputs` previously shared a cache
  entry, so one could receive another's result. The cache key now also compares
  the function's source text (`promise.toString()`).

  > **Note on behaviour change:** code that (intentionally or accidentally)
  > relied on different functions sharing a cache by equal inputs will now see
  > independent caches. This is the intended semantics. Closures with identical
  > source still share an entry; put the values they close over in `inputs`.

- **`inputs` is optional for promise functions that take no arguments.**
  [#24] added a default in the 0.3.4 cycle, but the typed signature that shipped
  in 0.3.4 dropped it, so calling without `inputs` threw at runtime. Functions
  with parameters still require `inputs`, and the types now enforce that.

- **`Map`, `Set` and typed-array inputs are compared by content.** The default
  `fast-deep-equal` build treated any two `Map`s or `Set`s as equal, so they
  shared a cache entry; the `es6` build is used instead.

- **A `lifespan` above `2^31 - 1` ms (about 24.8 days) is kept for the session**
  instead of being clamped to 1 ms by `setTimeout` and evicted immediately.

### Added

- Vitest runtime tests and `tsd` type tests; the test suite is type-checked.
- A test guarding the published file list.
- Biome for linting and formatting.
- GitHub Actions CI (Node 20.19 and 22) that also builds the example.
- Source maps and declaration maps in the published build.
- `types`, `funding`, `sideEffects`, and `files` fields, plus a `react` peer
  dependency, in `package.json`.

### Changed

- Build target raised from ES5 to ES2018.
- `example/` migrated from Create React App to Vite + React 18.
- Replaced `any` with `unknown` throughout the source types.
- Bumped `fast-deep-equal` to v3 and TypeScript to 5.

## [0.3.4]

- Typed `usePromise`: the return type is inferred from the promise and `inputs`
  are checked against the function's parameters.

## [0.3.1] – [0.3.3]

- Added the example app and a CodeSandbox link; excluded the example from the
  npm package.

## [0.3.0]

- Switched deep equality to `fast-deep-equal`.

## [0.2.0] – [0.2.1]

- Added an example app and README.

## 0.1.0

- Initial release: `usePromise` hook with Suspense support and a `lifespan`
  cache option.

[0.4.0]: https://github.com/vigzmv/react-promise-suspense/compare/v0.3.4...v0.4.0
[0.3.4]: https://github.com/vigzmv/react-promise-suspense/compare/v0.3.3...v0.3.4
[0.3.3]: https://github.com/vigzmv/react-promise-suspense/compare/v0.3.0...v0.3.3
[0.3.1]: https://github.com/vigzmv/react-promise-suspense/compare/v0.3.0...v0.3.1
[0.3.0]: https://github.com/vigzmv/react-promise-suspense/compare/v0.2.1...v0.3.0
[0.2.1]: https://github.com/vigzmv/react-promise-suspense/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/vigzmv/react-promise-suspense/releases/tag/v0.2.0
[#8]: https://github.com/vigzmv/react-promise-suspense/issues/8
[#24]: https://github.com/vigzmv/react-promise-suspense/pull/24
