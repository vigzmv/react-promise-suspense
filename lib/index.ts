const deepEqual = require("fast-deep-equal");

interface PromiseCache {
  promise: Promise<void>;
  inputs: Array<any>;
  error?: any;
  response?: any;
}

const promiseCaches: PromiseCache[] = [];

const usePromise = <Args extends any[], Result>(
  promise: (...inputs: Args) => Promise<Result>,
  inputs: Args,
  lifespan: number = 0
): Result => {
  // Cache Check
  for (const promiseCache of promiseCaches) {
    if (deepEqual(inputs, promiseCache.inputs)) {
      // If an error occurred,
      if (Object.prototype.hasOwnProperty.call(promiseCache, "error")) {
        throw promiseCache.error;
      }

      // If a response was successful,
      else if (Object.prototype.hasOwnProperty.call(promiseCache, "response")) {
        return promiseCache.response;
      }
      throw promiseCache.promise;
    }
  }

  // The request is new or has changed.
  const promiseCache: PromiseCache = {
    promise:
      // Make the promise request.
      promise(...inputs)
        .then((response: Result) => {
          promiseCache.response = response;
        })
        .catch((e: Error) => {
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
    inputs,
  };

  promiseCaches.push(promiseCache);
  throw promiseCache.promise;
};

export = usePromise;
