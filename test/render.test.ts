import { describe, expect, it } from "vitest";
import { fileURLToPath } from "node:url";
import { renderHuman, renderMarkdown } from "../src/render.js";
import { scanRepository } from "../src/scan.js";

const fixture = fileURLToPath(new URL("./fixtures/risky-repo", import.meta.url));

describe("rendering", () => {
  it("makes the trigger and evidence visible in human output", () => {
    const output = renderHuman(scanRepository(fixture));
    expect(output).toContain("RunSurface");
    expect(output).toContain("AUTO-LOCAL");
    expect(output).toContain("npm install");
    expect(output).toContain("No files executed");
  });

  it("renders a stable markdown report", () => {
    const output = renderMarkdown(scanRepository(fixture));
    expect(output).toContain("# RunSurface report");
    expect(output).toContain("| Kind | Severity | Trigger | File | Detail |");
  });
});
