export const SURFACE_KINDS = [
  "auto-local",
  "agent-context",
  "remote-ci",
  "manual-run",
  "container",
] as const;

export type SurfaceKind = (typeof SURFACE_KINDS)[number];
export type Severity = "high" | "medium" | "low" | "info";

export interface Finding {
  kind: SurfaceKind;
  severity: Severity;
  trigger: string;
  file: string;
  line: number;
  detail: string;
  evidence: string;
}

export interface SurfaceReport {
  root: string;
  findings: Finding[];
  counts: Record<SurfaceKind, number>;
  scannedFiles: number;
  skippedFiles: number;
}
