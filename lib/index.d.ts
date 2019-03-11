declare const deepEqual: any;

interface PromiseCache {
  promise?: Promise<void>;
  error?: any;
  inputs: Array<any>;
  response?: any;
}

declare const PromiseCaches: PromiseCache[];
declare const usePromise: (
  promise: (...inputs: any) => any,
  inputs: Array<any>,
  lifespan?: numbers,
) => any;
