import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

let usePromise: typeof import("./index");

// Each test gets a fresh module so the module-level cache does not leak.
beforeEach(async () => {
  vi.resetModules();
  usePromise = (await import("./index")).default;
});

afterEach(() => {
  vi.useRealTimers();
});

// Run `call` the way a Suspense boundary would: await a thrown promise, retry.
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
  it("throws a promise on the first call", () => {
    expect(() => usePromise(() => Promise.resolve(1), [])).toThrow(Promise);
  });

  it("returns the resolved value on a subsequent call", async () => {
    const value = await resolveSuspense(() =>
      usePromise(() => Promise.resolve(42), []),
    );
    expect(value).toBe(42);
  });

  it("throws the rejection reason once the promise settles", async () => {
    const boom = new Error("boom");
    const fn = () => Promise.reject(boom);

    expect(() => usePromise(fn, [])).toThrow(Promise);
    await expect(resolveSuspense(() => usePromise(fn, []))).rejects.toBe(boom);
  });

  it("returns the cached value for deep-equal inputs (one invocation)", async () => {
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
    const fn = (n: number) => Promise.resolve(n * 2);
    const a = await resolveSuspense(() => usePromise(fn, [1]));
    const b = await resolveSuspense(() => usePromise(fn, [2]));
    expect(a).toBe(2);
    expect(b).toBe(4);
  });

  it("distinguishes Set inputs by their contents", async () => {
    const fn = (s: Set<number>) => Promise.resolve([...s].join(","));
    const a = await resolveSuspense(() => usePromise(fn, [new Set([1])]));
    const b = await resolveSuspense(() => usePromise(fn, [new Set([2])]));
    expect(a).toBe("1");
    expect(b).toBe("2");
  });

  it("does not let different functions with equal inputs collide (#8)", async () => {
    const fnA = (x: number) => Promise.resolve(`A:${x}`);
    const fnB = (x: number) => Promise.resolve(`B:${x}`);
    const a = await resolveSuspense(() => usePromise(fnA, [1]));
    const b = await resolveSuspense(() => usePromise(fnB, [1]));
    expect(a).toBe("A:1");
    expect(b).toBe("B:1");
  });

  it("separates identical-source closures by the inputs they are given", async () => {
    // Both arrow functions stringify identically; only `inputs` tells them apart.
    const load = (id: number) =>
      usePromise(() => Promise.resolve(`user:${id}`), [id]);
    const a = await resolveSuspense(() => load(1));
    const b = await resolveSuspense(() => load(2));
    expect(a).toBe("user:1");
    expect(b).toBe("user:2");
  });

  it("defaults inputs to an empty array when omitted", async () => {
    const value = await resolveSuspense(() =>
      usePromise(() => Promise.resolve("noarg")),
    );
    expect(value).toBe("noarg");
  });

  it("evicts the cache after the given lifespan", async () => {
    vi.useFakeTimers();
    let calls = 0;
    const fn = () => {
      calls++;
      return Promise.resolve("v");
    };
    await resolveSuspense(() => usePromise(fn, [], 50));
    expect(usePromise(fn, [])).toBe("v");
    expect(calls).toBe(1);

    await vi.advanceTimersByTimeAsync(50);

    expect(() => usePromise(fn, [])).toThrow(Promise);
    expect(calls).toBe(2);
  });

  it("treats a lifespan beyond the timer limit as session-long", async () => {
    // Fake timers reproduce setTimeout's clamp of delays above 2^31-1 ms to 1 ms.
    vi.useFakeTimers();
    let calls = 0;
    const fn = () => {
      calls++;
      return Promise.resolve("v");
    };
    await resolveSuspense(() => usePromise(fn, [], 2 ** 31));

    await vi.advanceTimersByTimeAsync(10);

    expect(usePromise(fn, [])).toBe("v");
    expect(calls).toBe(1);
  });
});
