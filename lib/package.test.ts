import { execFileSync } from "node:child_process";
import { describe, expect, it } from "vitest";

// Guards the `files` allowlist so tests, configs and the example never ship.
// Relies on an existing `build/`, which `npm install` produces via `prepare`.
describe("published package", () => {
  it("contains only the build output, source, and docs", () => {
    const stdout = execFileSync(
      "npm",
      ["pack", "--dry-run", "--json", "--ignore-scripts"],
      {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
        shell: process.platform === "win32",
      },
    );
    const [pack] = JSON.parse(stdout) as [{ files: { path: string }[] }];
    const files = pack.files.map((file) => file.path).sort();

    expect(files).toEqual([
      "CHANGELOG.md",
      "LICENSE",
      "README.md",
      "build/index.d.ts",
      "build/index.d.ts.map",
      "build/index.js",
      "build/index.js.map",
      "lib/index.ts",
      "package.json",
    ]);
  });
});
