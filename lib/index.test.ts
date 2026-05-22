import { describe, expect, it, vi } from "vitest";

type UsePromise = <Args extends unknown[], Result>(
  promise: (...inputs: Args) => Promise<Result>,
  inputs?: Args,
  lifespan?: number,
) => Result;

// Each test gets a fresh module so the module-level cache does not leak.
const loadUsePromise = async (): Promise<UsePromise> => {
  vi.resetModules();
  const mod = await import("./index");
  return (mod as { default: UsePromise }).default;
};

// Mimic a Suspense render: the first call throws a promise; await it and retry.
async function resolveSuspense<R>(call: () => R): Promise<R> {
  try {
    return call();
  } catch (thrown) {
    if (thrown instanceof Promise) {
      await thrown;
      return call();
    }
    throw thrown;
  }
}

describe("usePromise", () => {
  it("throws a promise on the first call", async () => {
    const usePromise = await loadUsePromise();
    let thrown: unknown;
    try {
      usePromise(() => Promise.resolve(1), []);
    } catch (e) {
      thrown = e;
    }
    expect(thrown).toBeInstanceOf(Promise);
  });

  it("returns the resolved value on a subsequent call", async () => {
    const usePromise = await loadUsePromise();
    const value = await resolveSuspense(() =>
      usePromise(() => Promise.resolve(42), []),
    );
    expect(value).toBe(42);
  });

  it("throws the error synchronously after rejection", async () => {
    const usePromise = await loadUsePromise();
    const boom = new Error("boom");
    let thrown: unknown;
    try {
      usePromise(() => Promise.reject(boom), []);
    } catch (e) {
      await e; // wait for the suspense promise to settle
    }
    try {
      usePromise(() => Promise.reject(boom), []);
    } catch (e) {
      thrown = e;
    }
    expect(thrown).toBe(boom);
  });

  it("returns the cached value for deep-equal inputs (one invocation)", async () => {
    const usePromise = await loadUsePromise();
    let calls = 0;
    const fn = (_obj: { a: number }) => {
      calls++;
      return Promise.resolve("ok");
    };
    await resolveSuspense(() => usePromise(fn, [{ a: 1 }]));
    const second = usePromise(fn, [{ a: 1 }]);
    expect(second).toBe("ok");
    expect(calls).toBe(1);
  });

  it("keeps separate caches for different inputs", async () => {
    const usePromise = await loadUsePromise();
    const fn = (n: number) => Promise.resolve(n * 2);
    const a = await resolveSuspense(() => usePromise(fn, [1]));
    const b = await resolveSuspense(() => usePromise(fn, [2]));
    expect(a).toBe(2);
    expect(b).toBe(4);
  });

  it("does not let different functions with equal inputs collide (#8)", async () => {
    const usePromise = await loadUsePromise();
    const fnA = (x: number) => Promise.resolve(`A:${x}`);
    const fnB = (x: number) => Promise.resolve(`B:${x}`);
    const a = await resolveSuspense(() => usePromise(fnA, [1]));
    const b = await resolveSuspense(() => usePromise(fnB, [1]));
    expect(a).toBe("A:1");
    expect(b).toBe("B:1");
  });

  it("defaults inputs to an empty array when omitted", async () => {
    const usePromise = await loadUsePromise();
    const value = await resolveSuspense(() =>
      usePromise(() => Promise.resolve("noarg")),
    );
    expect(value).toBe("noarg");
  });

  it("evicts the cache after the given lifespan", async () => {
    const usePromise = await loadUsePromise();
    let calls = 0;
    const fn = () => {
      calls++;
      return Promise.resolve("v");
    };
    await resolveSuspense(() => usePromise(fn, [], 50));
    expect(usePromise(fn, [])).toBe("v");
    expect(calls).toBe(1);

    await new Promise((resolve) => setTimeout(resolve, 90));

    let rethrown: unknown;
    try {
      usePromise(fn, []);
    } catch (e) {
      rethrown = e;
    }
    expect(rethrown).toBeInstanceOf(Promise);
    expect(calls).toBe(2);
  });
});
