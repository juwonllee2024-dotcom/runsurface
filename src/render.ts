import type { SurfaceReport } from "./types.js";

function upper(value: string): string {
  return value.toUpperCase();
}

function escapeMarkdown(value: string): string {
  return value.replaceAll("|", "\\|").replaceAll("\n", " ");
}

export function renderHuman(report: SurfaceReport): string {
  const totals = Object.entries(report.counts)
    .filter(([, count]) => count > 0)
    .map(([kind, count]) => `${upper(kind)} ${count}`)
    .join(" | ");
  const lines = [
    "RunSurface - static execution map",
    `root: ${report.root}`,
    `files: ${report.scannedFiles} scanned | ${report.skippedFiles} skipped${totals ? ` | ${totals}` : ""}`,
    "",
  ];

  if (report.findings.length === 0) {
    lines.push("No runnable or agent instruction surfaces found.");
  } else {
    for (const finding of report.findings) {
      lines.push(
        `[${upper(finding.kind)}] [${upper(finding.severity)}] ${finding.file}:${finding.line}`,
        `  trigger: ${finding.trigger}`,
        `  detail:  ${finding.detail}`,
        `  evidence: ${finding.evidence}`,
        "",
      );
    }
  }
  lines.push("No files executed. No network requests. No shell commands invoked.");
  return `${lines.join("\n")}\n`;
}

export function renderMarkdown(report: SurfaceReport): string {
  const lines = [
    "# RunSurface report",
    "",
    "> Static-only map. RunSurface reads files; it does not install, execute, or contact the network.",
    "",
    `- Root: \`${report.root}\``,
    `- Files scanned: ${report.scannedFiles}`,
    `- Findings: ${report.findings.length}`,
    "",
    "| Kind | Severity | Trigger | File | Detail |",
    "| --- | --- | --- | --- | --- |",
  ];
  if (report.findings.length === 0) {
    lines.push("| - | - | - | - | No surfaces found |", "");
  } else {
    for (const finding of report.findings) {
      lines.push(
        `| ${escapeMarkdown(finding.kind)} | ${escapeMarkdown(finding.severity)} | ${escapeMarkdown(finding.trigger)} | ${escapeMarkdown(finding.file)}:${finding.line} | ${escapeMarkdown(finding.detail)} |`,
      );
    }
    lines.push("");
  }
  lines.push("_No files executed. No network requests. No shell commands invoked._", "");
  return lines.join("\n");
}
