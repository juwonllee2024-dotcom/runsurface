# Product decision: RunSurface

Date: 2026-10-09

## Problem signal

People often learn what a repository can do only after a familiar command has already triggered it. Package install hooks, CI workflows, container directives, and AI instruction files are different mechanisms, but they share a missing first step: a short, local explanation of the trigger and the exact file behind it.

Current evidence:

- GitHub's current Trending page is heavily populated by agent skills, agent workflows, and code-review tooling: <https://github.com/trending>.
- GitHub documents package lifecycle scripts as commands that can run during npm lifecycle events: <https://docs.npmjs.com/cli/v11/using-npm/scripts/>.
- A GitHub Community discussion reports that common local ignore settings do not reliably prevent some AI coding tools from reading `.env` files: <https://github.com/orgs/community/discussions/159254>.
- Recent repository-safety projects show strong interest in “before you install/run” review, but the category is crowded: <https://github.com/leonardobissoli/repo-scan>, <https://github.com/Adversis/sketchy>, <https://github.com/ota-run/ota>.

## Four independent innovation questions

| Candidate | Pain | Novelty | Build today | Shareability | OSS fit | Total | Decision |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| RunSurface: trigger map before first command | 5 | 4 | 5 | 4 | 5 | **23/25** | **Build** |
| ReadmeFlight: execute README quickstarts in a disposable lane | 4 | 2 | 4 | 3 | 5 | 18/25 | Reject: `readme-verify`, `docs-that-run`, and `repo-proof` already occupy the obvious lane |
| ExtPlain: translate browser-extension permissions before install | 4 | 2 | 4 | 4 | 4 | 18/25 | Reject: capability libraries and extension scanners already cover the wedge |
| PortStory: explain and safely stop localhost owners | 5 | 2 | 3 | 3 | 4 | 17/25 | Reject: `sonar`, `portcheck`, `porthole`, and several cross-platform inspectors are active |

## Innovation hypothesis

**If a tool shows the trigger before the command instead of a generic safety score after the fact, maintainers and agent users will add it to CI because the output is immediately actionable.**

- One difference: every finding is a trigger -> file -> line -> evidence chain; there is no opaque “safe” score.
- First 7-day experiment: ask 10 maintainers/agent users to run `runsurface scan .` on one repository and record whether at least 3 add `gate --fail-on auto-local` or open an issue for a missing detector.
- First users: open-source maintainers, people reviewing AI-agent skills, and developers onboarding unfamiliar repositories.
- Revenue hypothesis: keep the CLI MIT/free; if the evidence supports it, offer an optional hosted organization dashboard or paid policy packs later. No revenue is assumed.

## Why not claim safety

RunSurface maps known static surfaces. It does not execute code, inspect runtime behavior, prove benign intent, or replace sandboxing. Its value is the small decision before the first install/build/agent step.
