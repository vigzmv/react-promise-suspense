import { expectError, expectType } from "tsd";

import usePromise = require("../build");

const getString = (url: string): Promise<string> => Promise.resolve(url);

// Return type is inferred from the promise's resolved type.
expectType<string>(usePromise(getString, ["https://example.com"]));

// Inputs flow through to the promise function's parameters.
expectType<number>(usePromise((n: number) => Promise.resolve(n * 2), [21]));

// inputs is optional for zero-argument promise functions.
expectType<number>(usePromise(() => Promise.resolve(1)));

// For zero-argument functions any inputs act purely as the cache key, which is
// how a closure over component state is kept distinct per value.
expectType<number>(usePromise(() => Promise.resolve(1), [42, "key"]));

// Optional parameters still require inputs and still type-check them.
const getOptional = (n?: number): Promise<number> => Promise.resolve(n ?? 0);
expectType<number>(usePromise(getOptional, []));
expectError(usePromise(getOptional, ["x"]));

// lifespan is an optional trailing number.
expectType<string>(usePromise(getString, ["x"], 1000));

// Omitting inputs is rejected when the promise function has parameters.
expectError(usePromise(getString));

// Wrong input types are rejected.
expectError(usePromise(getString, [123]));

// Too many inputs are rejected.
expectError(usePromise(getString, ["x", "y"]));
