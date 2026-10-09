# Security policy

## Scope

RunSurface is a static, local-only repository mapper. It is not a malware verdict, sandbox, or guarantee that a repository is safe to run.

## Reporting a vulnerability

Please do not open a public issue for a security-sensitive report. Use GitHub Security Advisories for this repository when enabled. If that channel is unavailable, open a minimal issue asking for a private reporting route without including secrets or exploit details.

Include:

- the affected version or commit;
- a minimal reproduction that does not contain real credentials;
- the expected and observed behavior; and
- any platform or filesystem assumptions.

RunSurface should never execute scanned repository code. If a change would require execution, network access, secret access, or following symlinks, document the threat model first and add an explicit test.

## Safe use

- Scan a local copy; do not paste private repository contents into third-party services.
- Treat evidence snippets as sensitive because they come from the scanned repository.
- Keep using isolation, review, dependency controls, and endpoint protection for untrusted code.
