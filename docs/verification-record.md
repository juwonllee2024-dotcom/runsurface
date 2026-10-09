# Verification record

Release: `v0.1.0`

## Test-first sequence

1. Wrote fixture-backed scanner, renderer, and policy tests against a stub implementation.
2. Confirmed RED: the initial run failed 4 assertions because the scanner and renderers were intentionally empty.
3. Implemented the smallest static scanner and policy surface.
4. Confirmed GREEN: 5 tests passed across 3 test files.

## Required checks

- `npm ci --ignore-scripts`: passed; 149 packages installed, 0 vulnerabilities reported by npm.
- `npm run typecheck`: passed.
- `npm run lint`: passed.
- `npm test`: passed; 3 files, 5 tests.
- `npm run build`: passed.
- `npm audit --audit-level=high`: passed; 0 vulnerabilities.
- `git diff --check`: passed for working and staged changes.
- `npm pack --ignore-scripts`: passed; 21 package files included.
- Tarball SHA-256: `868baeec444fb6b70ffed9eee0d184ff0b77fc832ec7a77c06774385cd745b73`.
- Secret-pattern scan over project text: no matches.
- CLI smoke: risky fixture produced 1 automatic hook, 1 agent context, 1 remote workflow, 1 manual script, and 2 container findings; the gate returned expected exit `1`.
- Clean-scope smoke: `gate src --fail-on auto-local --format json` returned expected exit `0`.
- CI URL: added after the first public GitHub run completes.

## Safety boundary

The smoke fixture contains a package `postinstall`, an agent instruction file, a GitHub workflow, a Makefile, and a Dockerfile. The verification command scans it and prints findings. It does not run the fixture's package scripts, workflow, Makefile, or Dockerfile.
