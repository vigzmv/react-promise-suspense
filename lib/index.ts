// The es6 build also compares Map, Set and typed-array contents.
import deepEqual = require("fast-deep-equal/es6");

// setTimeout treats delays above this as 1 ms, which would evict immediately.
const MAX_TIMEOUT_MS = 2 ** 31 - 1;

interface PromiseCache {
  promise: Promise<void>;
  inputs: unknown[];
  cacheKey: string;
  error?: unknown;
  response?: unknown;
}

const promiseCaches: PromiseCache[] = [];

/**
 * Resolve a promise with React Suspense support.
 *
 * On the first call the promise is started and thrown, so a `<Suspense>`
 * boundary can render its fallback. Once it resolves, the cached value is
 * returned on the next render; if it rejects, the error is thrown for the
 * nearest error boundary to catch.
 *
 * Results are cached by the promise function's source text (`promise.toString()`)
 * plus a deep-equal comparison of `inputs`. Closures with identical source share
 * an entry, so include every value the function closes over in `inputs`.
 *
 * @param promise - Function returning the promise to resolve.
 * @param inputs - Arguments applied to `promise` and used as the cache key.
 *   May be omitted only when `promise` takes no arguments. Treat as immutable.
 * @param lifespan - Milliseconds to retain the cached result after it settles,
 *   fixed by the call that creates the entry; `0` (default) keeps it for the session.
 * @returns The resolved value of the promise.
 *
 * @example
 * const fetchJson = (url: string) => fetch(url).then((res) => res.json());
 * const data = usePromise(fetchJson, ["https://pokeapi.co/api/v2/pokemon/ditto/"]);
 */
const usePromise = <Args extends unknown[], Result>(
  promise: (...inputs: Args) => Promise<Result>,
  // Conditional so that a zero-argument function may omit `inputs` (or pass any
  // array as a pure cache key) while functions with parameters must supply them.
  ...rest: Args extends []
    ? [inputs?: unknown[], lifespan?: number]
    : [inputs: Args, lifespan?: number]
): Result => {
  const [inputs = [], lifespan = 0] = rest as [unknown[]?, number?];
  const cacheKey = promise.toString();

  // Cache check
  for (const promiseCache of promiseCaches) {
    if (
      cacheKey === promiseCache.cacheKey &&
      deepEqual(inputs, promiseCache.inputs)
    ) {
      // Key presence rather than truthiness: a promise may settle with undefined.
      if ("error" in promiseCache) {
        throw promiseCache.error;
      }
      if ("response" in promiseCache) {
        return promiseCache.response as Result;
      }
      throw promiseCache.promise;
    }
  }

  // The request is new or has changed.
  const promiseCache: PromiseCache = {
    cacheKey,
    inputs,
    promise:
      // Make the promise request.
      promise(...(inputs as Args))
        .then((response) => {
          promiseCache.response = response;
        })
        .catch((e: unknown) => {
          promiseCache.error = e;
        })
        .then(() => {
          if (lifespan > 0 && lifespan <= MAX_TIMEOUT_MS) {
            setTimeout(() => {
              const index = promiseCaches.indexOf(promiseCache);
              if (index !== -1) {
                promiseCaches.splice(index, 1);
              }
            }, lifespan);
          }
        }),
  };

  promiseCaches.push(promiseCache);
  throw promiseCache.promise;
};

export = usePromise;
