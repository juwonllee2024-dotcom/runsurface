import { describe, expect, it } from "vitest";
import { fileURLToPath } from "node:url";
import { hasDeniedFindings } from "../src/policy.js";
import { scanRepository } from "../src/scan.js";

const fixture = fileURLToPath(new URL("./fixtures/risky-repo", import.meta.url));

describe("policy", () => {
  it("fails only when a selected surface is present", () => {
    const report = scanRepository(fixture);
    expect(hasDeniedFindings(report, ["auto-local"])).toBe(true);
    expect(hasDeniedFindings(report, ["agent-context"])).toBe(true);
    expect(hasDeniedFindings(report, [])).toBe(false);
  });
});
