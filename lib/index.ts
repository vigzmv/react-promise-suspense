const deepEqual = require("fast-deep-equal");

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
 * Results are cached by the promise function's identity (`promise.toString()`)
 * plus a deep-equal comparison of `inputs`. Two different functions called with
 * equal inputs therefore no longer share a cache entry.
 *
 * @param promise - Function returning the promise to resolve.
 * @param inputs - Arguments applied to `promise` and used as the cache key. Defaults to `[]`.
 * @param lifespan - Milliseconds to retain the cached result; `0` (default) keeps it for the session.
 * @returns The resolved value of the promise.
 *
 * @example
 * const fetchJson = (url: string) => fetch(url).then((res) => res.json());
 * const data = usePromise(fetchJson, ["https://pokeapi.co/api/v2/pokemon/ditto/"]);
 */
const usePromise = <Args extends unknown[], Result>(
  promise: (...inputs: Args) => Promise<Result>,
  inputs: Args = [] as unknown as Args,
  lifespan = 0,
): Result => {
  const cacheKey = promise.toString();

  // Cache check
  for (const promiseCache of promiseCaches) {
    if (
      cacheKey === promiseCache.cacheKey &&
      deepEqual(inputs, promiseCache.inputs)
    ) {
      // If an error occurred,
      if (Object.prototype.hasOwnProperty.call(promiseCache, "error")) {
        throw promiseCache.error;
      }

      // If a response was successful,
      else if (Object.prototype.hasOwnProperty.call(promiseCache, "response")) {
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
      promise(...inputs)
        .then((response: Result) => {
          promiseCache.response = response;
        })
        .catch((e: unknown) => {
          promiseCache.error = e;
        })
        .then(() => {
          if (lifespan > 0) {
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
