import fs from "node:fs";
import path from "node:path";
import type { Finding, Severity, SurfaceKind, SurfaceReport } from "./types.js";
import { SURFACE_KINDS } from "./types.js";

const IGNORED_DIRECTORIES = new Set([
  ".git",
  ".hg",
  ".svn",
  "node_modules",
  "dist",
  "build",
  "coverage",
  "target",
  "vendor",
  ".next",
  ".turbo",
  ".venv",
  "__pycache__",
]);

const MAX_FILE_BYTES = 512 * 1024;
const MAX_FILES = 10_000;
const AUTO_SCRIPTS = new Set([
  "preinstall",
  "install",
  "postinstall",
  "prepare",
  "prepublish",
  "prepublishOnly",
  "postpublish",
  "prepack",
  "postpack",
]);
const MANUAL_SCRIPTS = new Set(["setup", "bootstrap", "build", "dev", "start", "test"]);
const AGENT_FILES = new Set([
  "AGENTS.md",
  "CLAUDE.md",
  "CODEX.md",
  "GEMINI.md",
  "COPILOT.md",
  ".cursorrules",
  ".github/copilot-instructions.md",
]);
const MANUAL_FILES = new Set([
  "install.sh",
  "install.bash",
  "install.ps1",
  "install.cmd",
  "install.bat",
  "setup.sh",
  "setup.ps1",
  "bootstrap.sh",
]);

interface ScanState {
  findings: Finding[];
  scannedFiles: number;
  skippedFiles: number;
}

interface WalkResult {
  files: string[];
  skippedFiles: number;
}

function toRelative(root: string, file: string): string {
  const relative = path.relative(root, file).split(path.sep).join("/");
  return relative || ".";
}

function lineFor(text: string, needle: string | RegExp): { line: number; evidence: string } {
  const lines = text.split(/\r?\n/);
  const index = lines.findIndex((line) =>
    typeof needle === "string" ? line.includes(needle) : needle.test(line),
  );
  const line = index < 0 ? 1 : index + 1;
  return { line, evidence: (lines[index < 0 ? 0 : index] ?? "").trim().slice(0, 240) };
}

function readText(file: string, state: ScanState): string | undefined {
  try {
    const stat = fs.statSync(file);
    if (stat.size > MAX_FILE_BYTES) {
      state.skippedFiles += 1;
      return undefined;
    }
    const buffer = fs.readFileSync(file);
    if (buffer.includes(0)) {
      state.skippedFiles += 1;
      return undefined;
    }
    return buffer.toString("utf8").replace(/^\uFEFF/, "");
  } catch {
    state.skippedFiles += 1;
    return undefined;
  }
}

function walk(root: string): WalkResult {
  const files: string[] = [];
  let skippedFiles = 0;

  function visit(directory: string): void {
    if (files.length >= MAX_FILES) return;
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(directory, { withFileTypes: true });
    } catch {
      skippedFiles += 1;
      return;
    }

    for (const entry of entries) {
      if (files.length >= MAX_FILES) break;
      const fullPath = path.join(directory, entry.name);
      if (entry.isSymbolicLink()) {
        skippedFiles += 1;
      } else if (entry.isDirectory()) {
        if (IGNORED_DIRECTORIES.has(entry.name)) {
          skippedFiles += 1;
        } else {
          visit(fullPath);
        }
      } else if (entry.isFile()) {
        files.push(fullPath);
      }
    }
  }

  visit(root);
  return { files, skippedFiles };
}

function addFinding(
  state: ScanState,
  root: string,
  kind: SurfaceKind,
  severity: Severity,
  trigger: string,
  file: string,
  line: number,
  detail: string,
  evidence: string,
): void {
  state.findings.push({
    kind,
    severity,
    trigger,
    file: toRelative(root, file),
    line,
    detail,
    evidence,
  });
}

function inspectPackageJson(root: string, file: string, text: string, state: ScanState): void {
  let packageJson: { scripts?: Record<string, unknown> };
  try {
    packageJson = JSON.parse(text) as { scripts?: Record<string, unknown> };
  } catch {
    return;
  }
  const scripts = packageJson.scripts;
  if (!scripts || typeof scripts !== "object") return;

  for (const [name, command] of Object.entries(scripts)) {
    if (typeof command !== "string") continue;
    const location = lineFor(text, `"${name}"`);
    if (AUTO_SCRIPTS.has(name)) {
      addFinding(
        state,
        root,
        "auto-local",
        "high",
        "npm install / pnpm install / yarn install",
        file,
        location.line,
        `${name} lifecycle hook can run automatically during package installation`,
        `${name} -> ${command}`,
      );
    } else if (MANUAL_SCRIPTS.has(name)) {
      addFinding(
        state,
        root,
        "manual-run",
        "low",
        `npm run ${name}`,
        file,
        location.line,
        `named script runs only when a person or tool invokes it`,
        `${name} -> ${command}`,
      );
    }
  }
}

function inspectPyproject(root: string, file: string, text: string, state: ScanState): void {
  const match = /^\s*build-backend\s*=\s*["']([^"']+)["']/m.exec(text);
  if (!match) return;
  const location = lineFor(text, "build-backend");
  addFinding(
    state,
    root,
    "auto-local",
    "medium",
    "pip install / python -m build",
    file,
    location.line,
    "the build backend can execute while the project is installed or built",
    location.evidence,
  );
}

function inspectWorkflow(root: string, file: string, text: string, state: ScanState): void {
  if (!/^\s*on\s*:/m.test(text) || !/^\s*(?:-\s*)?run\s*:/m.test(text)) return;
  const trigger = lineFor(text, /^\s*on\s*:/m);
  const command = lineFor(text, /^\s*(?:-\s*)?run\s*:/m);
  addFinding(
    state,
    root,
    "remote-ci",
    "medium",
    "GitHub Actions event",
    file,
    command.line,
    "a workflow can execute repository commands on its configured remote events",
    `${trigger.evidence}; ${command.evidence}`,
  );
}

function inspectDockerfile(root: string, file: string, text: string, state: ScanState): void {
  const lines = text.split(/\r?\n/);
  for (let index = 0; index < lines.length; index += 1) {
    const match = /^\s*(RUN|ENTRYPOINT|CMD)\b(.*)$/i.exec(lines[index] ?? "");
    if (!match) continue;
    const directive = match[1].toUpperCase();
    addFinding(
      state,
      root,
      "container",
      "medium",
      directive === "RUN" ? "docker build" : "docker run",
      file,
      index + 1,
      `${directive} executes inside a container lifecycle`,
      `${directive}${match[2]}`.trim().slice(0, 240),
    );
  }
}

function inspectFile(root: string, file: string, state: ScanState): void {
  const relative = toRelative(root, file);
  const basename = path.basename(file);
  const normalizedBasename = basename.toLowerCase();
  const text = readText(file, state);
  if (text === undefined) return;

  if (basename === "package.json") inspectPackageJson(root, file, text, state);
  if (basename === "pyproject.toml") inspectPyproject(root, file, text, state);

  if (relative.startsWith(".github/workflows/") && /\.(yaml|yml)$/i.test(basename)) {
    inspectWorkflow(root, file, text, state);
  }

  if (normalizedBasename === "dockerfile" || normalizedBasename.startsWith("dockerfile.")) {
    inspectDockerfile(root, file, text, state);
  }

  const isAgentFile = AGENT_FILES.has(basename) || relative.endsWith("/.cursorrules");
  const isSkillFile = basename === "SKILL.md" && !relative.includes("node_modules/");
  if (isAgentFile || isSkillFile) {
    const location = lineFor(text, /\S/);
    addFinding(
      state,
      root,
      "agent-context",
      "medium",
      "AI agent opens the repository",
      file,
      location.line,
      "an agent instruction file may influence how an AI tool reads or changes this repository",
      location.evidence,
    );
  }

  if (MANUAL_FILES.has(normalizedBasename)) {
    const location = lineFor(text, /\S/);
    addFinding(
      state,
      root,
      "manual-run",
      "medium",
      `person invokes ${basename}`,
      file,
      location.line,
      "an installer or bootstrap script is present but is not executed by RunSurface",
      location.evidence,
    );
  }
}

function compareFindings(left: Finding, right: Finding): number {
  return (
    left.file.localeCompare(right.file) ||
    left.line - right.line ||
    left.kind.localeCompare(right.kind) ||
    left.detail.localeCompare(right.detail)
  );
}

export function scanRepository(root: string): SurfaceReport {
  const absoluteRoot = path.resolve(root);
  const walked = walk(absoluteRoot);
  const state: ScanState = {
    findings: [],
    scannedFiles: 0,
    skippedFiles: walked.skippedFiles,
  };
  for (const file of walked.files) {
    state.scannedFiles += 1;
    inspectFile(absoluteRoot, file, state);
  }

  state.findings.sort(compareFindings);
  const counts = Object.fromEntries(SURFACE_KINDS.map((kind) => [kind, 0])) as Record<
    SurfaceKind,
    number
  >;
  for (const finding of state.findings) counts[finding.kind] += 1;

  return {
    root: absoluteRoot,
    findings: state.findings,
    counts,
    scannedFiles: state.scannedFiles,
    skippedFiles: state.skippedFiles,
  };
}
