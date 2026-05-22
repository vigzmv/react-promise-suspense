# Changelog

All notable changes to this project are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.4.0]

### Fixed

- **Cache identity now includes the promise function** ([#8]). Two different
  promise functions called with deeply equal `inputs` previously shared a cache
  entry, so one could receive another's result. The cache key now also compares
  `promise.toString()`.

  > **Note on behaviour change:** code that (intentionally or accidentally)
  > relied on different functions sharing a cache by equal inputs will now see
  > independent caches. This is the intended semantics. The function signature
  > is unchanged.

- `inputs` now reliably defaults to `[]` when omitted.

### Added

- Vitest runtime tests and `tsd` type tests.
- Biome for linting and formatting.
- GitHub Actions CI (Node 20.19 and 22).
- Source maps and declaration maps in the published build.
- `types`, `funding`, `sideEffects`, `engines`, and `files` fields, plus a
  `react` peer dependency, in `package.json`.

### Changed

- Build target raised from ES5 to ES2018.
- `example/` migrated from Create React App to Vite + React 18.
- Replaced `any` with `unknown` throughout the source types.
- Bumped `fast-deep-equal` to v3.

## [0.3.0] – [0.3.4]

- Switched deep equality to `fast-deep-equal`.
- Made `inputs` optional.
- Improved TypeScript types and added typed example usage.
- Documentation and dependency maintenance.

## [0.2.0] – [0.2.1]

- Added an example app and README.

## [0.1.0]

- Initial release: `usePromise` hook with Suspense support and a `lifespan`
  cache option.

[0.4.0]: https://github.com/vigzmv/react-promise-suspense/releases/tag/0.4.0
[0.3.0]: https://github.com/vigzmv/react-promise-suspense/releases/tag/0.3.0
[0.2.0]: https://github.com/vigzmv/react-promise-suspense/releases/tag/0.2.0
[0.1.0]: https://github.com/vigzmv/react-promise-suspense/releases/tag/0.1.0
[#8]: https://github.com/vigzmv/react-promise-suspense/issues/8
