import type { SurfaceKind, SurfaceReport } from "./types.js";

export function hasDeniedFindings(
  report: SurfaceReport,
  deniedKinds: readonly SurfaceKind[],
): boolean {
  const denied = new Set(deniedKinds);
  return report.findings.some((finding) => denied.has(finding.kind));
}
