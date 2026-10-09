#!/usr/bin/env node
import { pathToFileURL } from "node:url";
import { hasDeniedFindings } from "./policy.js";
import { renderHuman, renderMarkdown } from "./render.js";
import { scanRepository } from "./scan.js";
import { SURFACE_KINDS, type SurfaceKind } from "./types.js";

type OutputFormat = "human" | "json" | "markdown";

interface CliOptions {
  command: "scan" | "gate";
  root: string;
  format: OutputFormat;
  failOn: SurfaceKind[];
}

function usage(): string {
  return [
    "RunSurface — map what a repository can run before you run it.",
    "",
    "Usage:",
    "  runsurface scan [path] [--format human|json|markdown]",
    "  runsurface gate [path] --fail-on auto-local,remote-ci",
    "",
    "Surface kinds: auto-local, agent-context, remote-ci, manual-run, container",
    "Static only: no files are executed and no network requests are made.",
  ].join("\n");
}

function parseKinds(value: string): SurfaceKind[] {
  const kinds = value
    .split(",")
    .map((kind) => kind.trim())
    .filter(Boolean);
  const invalid = kinds.filter((kind) => !SURFACE_KINDS.includes(kind as SurfaceKind));
  if (invalid.length > 0) throw new Error(`unknown surface kind: ${invalid.join(", ")}`);
  return [...new Set(kinds)] as SurfaceKind[];
}

function parseArgs(argv: string[]): CliOptions | undefined {
  if (argv.length === 0 || argv.includes("--help") || argv.includes("-h")) return undefined;
  const command = argv[0] === "gate" ? "gate" : "scan";
  let root = ".";
  let format: OutputFormat = "human";
  let failOn: SurfaceKind[] = [];
  let rootTaken = false;

  for (let index = command === argv[0] ? 1 : 0; index < argv.length; index += 1) {
    const argument = argv[index] ?? "";
    if (argument === "--format") {
      const value = argv[++index];
      if (value !== "human" && value !== "json" && value !== "markdown") {
        throw new Error("--format must be human, json, or markdown");
      }
      format = value;
    } else if (argument.startsWith("--format=")) {
      const value = argument.slice("--format=".length);
      if (value !== "human" && value !== "json" && value !== "markdown") {
        throw new Error("--format must be human, json, or markdown");
      }
      format = value;
    } else if (argument === "--fail-on") {
      failOn = parseKinds(argv[++index] ?? "");
    } else if (argument.startsWith("--fail-on=")) {
      failOn = parseKinds(argument.slice("--fail-on=".length));
    } else if (argument.startsWith("-")) {
      throw new Error(`unknown option: ${argument}`);
    } else if (!rootTaken) {
      root = argument;
      rootTaken = true;
    } else {
      throw new Error(`unexpected argument: ${argument}`);
    }
  }

  if (command === "gate" && failOn.length === 0) {
    throw new Error("gate requires --fail-on with one or more surface kinds");
  }
  return { command, root, format, failOn };
}

export function main(argv = process.argv.slice(2)): number {
  try {
    const options = parseArgs(argv);
    if (!options) {
      console.log(usage());
      return 0;
    }
    const report = scanRepository(options.root);
    const output =
      options.format === "json"
        ? `${JSON.stringify(report, null, 2)}\n`
        : options.format === "markdown"
          ? renderMarkdown(report)
          : renderHuman(report);
    process.stdout.write(output);
    if (options.command === "gate" && hasDeniedFindings(report, options.failOn)) {
      const names = options.failOn.join(", ");
      process.stderr.write(`RunSurface gate failed: found one of [${names}]\n`);
      return 1;
    }
    return 0;
  } catch (error) {
    process.stderr.write(`RunSurface error: ${error instanceof Error ? error.message : String(error)}\n`);
    return 2;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = main();
}
