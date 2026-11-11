# Changelog

Entries describe code delivered in the repository; a version number does not imply publication to npm.

## 0.3.0 — 2026-11-11 (prototype)

- Added command-driven local configuration with `show`, `get`, `set`, `reset` and `--dry-run`.
- Added provider-neutral `brief` export for user-selected editors and AI clients.
- Added explicit `preview` and hash-approved `apply` flow for the profile README.
- Added safeguards against stale remote content, unapproved writes and `--dry-run` misuse.
- Added offline tests and documentation for publishing permissions.

## 0.2.0 — 2026-11-11 (prototype)

- Added optional inspection of top-ranked project READMEs (`--inspect`).
- Added local textual diff preview against the profile README.
- Expanded audit and test coverage.

## 0.1.0 — 2026-11-11 (prototype)

- Introduced CLI-only public profile audit, action plan, showcase ranking, achievements guide and three configurable README presets.
- Added zero-runtime-dependency Node.js package, automated tests and CI.
