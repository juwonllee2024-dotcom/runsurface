# RunSurface

## See what a repository can run before you run it. 🧭

RunSurface is a local-first CLI that turns a repository into a small, readable **execution map**.

It answers the question every clone deserves:

> **What can run, when can it run, and which file says so?**

```text
$ node dist/src/cli.js scan examples/risky-repo

RunSurface - static execution map
...
[AUTO-LOCAL] [HIGH] package.json:4
  trigger: npm install / pnpm install / yarn install
  detail:  postinstall lifecycle hook can run automatically during package installation
  evidence: postinstall -> node scripts/prepare.js
```

No install. No shell. No network. No score pretending to be certainty.

## Why this exists

Repositories increasingly contain package lifecycle hooks, CI workflows, container commands, and instructions for AI coding agents. They are useful, but the trigger is often hidden behind a familiar-looking `npm install`, `docker build`, or “open this folder in your agent”.

RunSurface makes that trigger visible before the first command. It is deliberately narrower than a malware scanner: it maps **execution surfaces**, cites the exact file and line, and lets a project choose which surface kinds are unacceptable in CI.

## Quick start

```powershell
git clone https://github.com/juwonllee2024-dotcom/runsurface.git
cd runsurface
npm ci --ignore-scripts
npm run build

node dist/src/cli.js scan path\to\repository
node dist/src/cli.js scan path\to\repository --format json
node dist/src/cli.js scan path\to\repository --format markdown
```

The CLI accepts a directory and reads it without executing anything.

### CI gate

Fail a job when a repository contains automatic local hooks or remote CI commands:

```powershell
node dist/src/cli.js gate . --fail-on auto-local,remote-ci
```

Exit codes:

| Code | Meaning |
| ---: | --- |
| `0` | Scan completed and the gate found no denied surface. |
| `1` | Scan completed and the gate found a denied surface. |
| `2` | Invalid input or scanner error. |

## What it maps

| Surface | Example trigger | What is cited |
| --- | --- | --- |
| `auto-local` | `npm install`, `pip install` | lifecycle hooks and Python build backends |
| `agent-context` | an AI tool opens the repository | `AGENTS.md`, `CLAUDE.md`, `.cursorrules`, `SKILL.md` |
| `remote-ci` | a GitHub Actions event | workflow trigger and first `run:` command |
| `manual-run` | `npm run build`, `make setup` | named scripts and task files |
| `container` | `docker build`, `docker run` | `RUN`, `ENTRYPOINT`, and `CMD` directives |

The human report includes the kind, severity, trigger, relative file, line, explanation, and a short evidence snippet. JSON is intended for CI or other local tools.

## Safety model

- **Read-only:** RunSurface never installs dependencies, invokes a shell, imports project code, starts a container, contacts a network, or follows symlinks.
- **Conservative scope:** It reports known trigger surfaces, not a claim that a repository is safe or malicious.
- **No secret collection:** It does not print file contents beyond short matching evidence lines. Treat evidence as potentially sensitive when scanning private code.
- **No remote scanning:** You provide a local directory. Clone and inspect it according to your own trust policy.
- **Review still matters:** A clean report is not a security guarantee; dynamic behavior, dependencies, generated files, and platform-specific hooks may be missed.

## Development

```powershell
npm ci --ignore-scripts
npm run verify
```

The test fixture contains intentionally visible surfaces so the output can be understood without running any project code:

```powershell
node dist/src/cli.js scan test/fixtures/risky-repo
```

## Status

RunSurface `v0.1.0` is a focused MVP. It is most useful as a fast first-touch map, not as a replacement for sandboxing, code review, dependency review, or endpoint security.

## License

MIT. See [LICENSE](LICENSE).

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). New detectors should include a fixture, a focused test, a false-positive explanation, and a line-level evidence example.
