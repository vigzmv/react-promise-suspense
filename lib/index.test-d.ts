import { expectError, expectType } from "tsd";

import usePromise = require("../build");

const getString = (url: string): Promise<string> => Promise.resolve(url);

// Return type is inferred from the promise's resolved type.
expectType<string>(usePromise(getString, ["https://example.com"]));

// Inputs flow through to the promise function's parameters.
expectType<number>(usePromise((n: number) => Promise.resolve(n * 2), [21]));

// inputs is optional for zero-argument promise functions.
expectType<number>(usePromise(() => Promise.resolve(1)));

// lifespan is an optional trailing number.
expectType<string>(usePromise(getString, ["x"], 1000));

// Wrong input types are rejected.
expectError(usePromise(getString, [123]));

// Too many inputs are rejected.
expectError(usePromise(getString, ["x", "y"]));
