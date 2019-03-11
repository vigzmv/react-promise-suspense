declare const deepEqual: any;

interface PromiseCache {
    promise?: Promise<void>;
    error?: any;
    inputs: Array<any>;
    response?: any;
}

declare const PromiseCaches: PromiseCache[];
declare const usePromise: (input: RequestInfo, init?: RequestInit | undefined, lifespan?: number) => any;
