import { describe, expect, it } from "vitest";
import { fileURLToPath } from "node:url";
import { scanRepository } from "../src/scan.js";

const fixture = fileURLToPath(new URL("./fixtures/risky-repo", import.meta.url));

describe("scanRepository", () => {
  it("maps automatic, agent, CI, manual, and container surfaces", () => {
    const report = scanRepository(fixture);
    const kinds = new Set(report.findings.map((finding) => finding.kind));

    expect(kinds).toEqual(
      new Set(["auto-local", "agent-context", "remote-ci", "manual-run", "container"]),
    );
    expect(report.findings.some((finding) => finding.file === "package.json" && finding.line === 4)).toBe(true);
    expect(report.findings.some((finding) => finding.file === ".github/workflows/check.yml")).toBe(true);
    expect(report.scannedFiles).toBeGreaterThan(0);
  });

  it("does not follow ignored dependency or build directories", () => {
    const report = scanRepository(fixture);
    expect(report.findings.some((finding) => finding.file.includes("node_modules"))).toBe(false);
    expect(report.findings.some((finding) => finding.file.includes("dist"))).toBe(false);
  });
});
