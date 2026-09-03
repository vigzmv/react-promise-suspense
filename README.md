# react-promise-suspense

A tiny React hook for resolving **any** promise with [Suspense](https://react.dev/reference/react/Suspense). Under 1 kB, dependency-light, and works from React 16.6 onward.

[![version](https://img.shields.io/npm/v/react-promise-suspense.svg)](https://www.npmjs.com/package/react-promise-suspense)
[![minzipped size](https://img.shields.io/bundlephobia/minzip/react-promise-suspense.svg)](https://bundlephobia.com/package/react-promise-suspense)
[![downloads](https://img.shields.io/npm/dm/react-promise-suspense.svg)](https://www.npmjs.com/package/react-promise-suspense)
[![CI](https://github.com/vigzmv/react-promise-suspense/actions/workflows/ci.yml/badge.svg)](https://github.com/vigzmv/react-promise-suspense/actions/workflows/ci.yml)

Inspired by [fetch-suspense](https://github.com/CharlesStover/fetch-suspense), but not limited to `fetch` — `usePromise` works with any promise-returning function.

## When to use it

`usePromise` caches a promise's result and integrates it with a `<Suspense>` boundary. Reach for it when:

- You're on **React 16.6–18** and want Suspense data fetching without React 19's `use()`.
- You want a **framework-agnostic** cache for any promise (timers, IndexedDB, WebSockets, a custom client), not just HTTP.
- You want something **tiny** rather than a full data layer.

See [When to use what](#when-to-use-what) for how it compares to `use()`, TanStack Query, and SWR.

## Install

```bash
npm install react-promise-suspense
```

`react` `>=16.6` is a peer dependency.

## Example

```tsx
import { Suspense } from "react";
import usePromise from "react-promise-suspense";

const fetchPokemon = (name: string) =>
  fetch(`https://pokeapi.co/api/v2/pokemon/${name}/`).then((res) => res.json());

function Pokemon({ name }: { name: string }) {
  // Suspends on first render; returns the cached result afterwards.
  const data = usePromise(fetchPokemon, [name]);
  return <pre>{JSON.stringify(data, null, 2)}</pre>;
}

function App() {
  return (
    <Suspense fallback="Loading…">
      <Pokemon name="ditto" />
    </Suspense>
  );
}
```

A runnable Vite app lives in [`example/`](./example).

## API

```ts
usePromise<Args extends unknown[], Result>(
  promise: (...inputs: Args) => Promise<Result>,
  inputs: Args,
  lifespan?: number,
): Result
```

The return type is inferred from the promise's resolved value, and `inputs` is type-checked against the promise function's parameters:

```ts
const getUser = (id: number): Promise<User> => api.get(`/users/${id}`);
const user = usePromise(getUser, [1]); // user: User
usePromise(getUser, ["1"]); // type error: string is not number
usePromise(getUser); // type error: inputs are required
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `promise` | `(...inputs) => Promise<Result>` | — | The promise-returning function. |
| `inputs` | `Args` | `[]` | Arguments applied to `promise`; also the cache key. May be omitted only when `promise` takes no arguments, in which case any array is accepted and serves purely as the cache key. |
| `lifespan` | `number` | `0` | Milliseconds to keep the cached result after it settles. `0` keeps it for the session. |

## Caching behaviour

Results are cached in a module-level store. A cache entry is matched when **both**:

1. the promise function's **source text** (`promise.toString()`) is identical, and
2. `inputs` are deeply equal (via the `es6` build of [`fast-deep-equal`](https://github.com/epoberezkin/fast-deep-equal), which also compares `Map`, `Set` and typed-array contents).

Two *different* functions called with equal inputs therefore do not collide — fixed in 0.4.0 ([#8](https://github.com/vigzmv/react-promise-suspense/issues/8)). Keying on source text has consequences worth knowing:

- **Closures with identical source share an entry.** `usePromise(() => fetchUser(id), [])` in two components fetches once and shows the same user in both. Put every value the function closes over in `inputs`, or pass it as an argument:

  ```tsx
  usePromise(() => fetchUser(id), [id]); // inputs act as the cache key
  usePromise(fetchUser, [id]);           // or let inputs be the arguments
  ```

- **Objects without enumerable own properties compare equal.** `Request`, `Headers`, `FormData` and class instances with a custom `toString` or `valueOf` are not told apart. Use plain data in `inputs`.
- **Treat `inputs` as immutable**, like a dependency array. The cache keeps a reference to them, so mutating them later changes the stored key.

Because the cache is a module-level singleton, it is shared across every component in the same JS context. Set `lifespan` to evict an entry some milliseconds after it settles:

```tsx
// Re-fetch at most once per 5 seconds.
const data = usePromise(fetchPokemon, [name], 5000);
```

The lifespan is fixed by the call that creates the entry; later calls with the same key reuse the entry and its timer. Values above `2^31 - 1` ms (about 24.8 days) are treated as `0`.

## Error handling

If the promise rejects, `usePromise` caches the rejection and re-throws it on every render for that key, so the nearest [error boundary](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary) can catch it. The example below uses [`react-error-boundary`](https://github.com/bvaughn/react-error-boundary); the [`example/`](./example) app shows a hand-written boundary.

```tsx
import { ErrorBoundary } from "react-error-boundary";

<ErrorBoundary fallback={<p>Failed to load.</p>}>
  <Suspense fallback="Loading…">
    <Pokemon name="ditto" />
  </Suspense>
</ErrorBoundary>
```

A cached rejection persists like a result. To let an error boundary retry, give the call a `lifespan` so the entry is evicted.

## Server-side rendering

The cache is a module-level singleton, so it is **not safe to share across requests** on a Node server — one request's data can leak into another's, and entries are never request-scoped. Treat `usePromise` as a client-side tool, or isolate per-request caching yourself until [scoped caches land](#roadmap).

## When to use what

| You need… | Use |
|-----------|-----|
| React 19+ and just want to await a promise | React's built-in [`use()`](https://react.dev/reference/react/use) |
| A full data layer (refetch, mutations, devtools, dedup) | [TanStack Query](https://tanstack.com/query) or [SWR](https://swr.vercel.app) |
| A tiny, framework-agnostic Suspense cache for any promise | `react-promise-suspense` |

## Roadmap

The next major release makes the cache controllable:

- A first-class cache object with `delete`, `clear`, and `size` ([#10](https://github.com/vigzmv/react-promise-suspense/issues/10)).
- Configurable, bounded (LRU) cache size ([#9](https://github.com/vigzmv/react-promise-suspense/issues/9)).
- A custom equality function ([#16](https://github.com/vigzmv/react-promise-suspense/issues/16)).
- An explicit cache key option, so closures no longer depend on source text.
- `createPromiseCache()` for isolated, per-scope caches.
- An options object: `usePromise(fn, inputs, { cache, cacheKey, lifespan })`.

## Contributing

Node 22 is used for development (see `.nvmrc`). `npm install` also builds the package.

```bash
npm install
npm test           # vitest
npm run test:types # tsd, against the built declarations
npm run typecheck  # tsc over source and tests
npm run lint       # biome
npm run build
```

## Funding

If this package is useful to you, consider [sponsoring](https://github.com/sponsors/vigzmv).

## License

[MIT](./LICENSE)
