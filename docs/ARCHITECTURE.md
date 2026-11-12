# Architecture

Node.js 22+ CLI; ES modules; no runtime dependencies, server or background worker.

| Area | Runtime |
| --- | --- |
| CLI and configuration | `src/cli.mjs`, `src/config.mjs` |
| GitHub reads and cache | `src/github.mjs`, `src/cache.mjs` |
| Activity | `src/contributions.mjs`, `src/calendar*.mjs` |
| Achievements | `src/achievement-matrix.mjs`, `src/badge-run.mjs` |
| Fast badge staging and write budget | `src/badge-bulk-git.mjs`, `src/badge-write-budget.mjs` |
| README and review | `src/render.mjs`, `src/workflow.mjs` |
| Pins and evidence | `src/engine.mjs`, `src/project-evidence.mjs` |

Reads and plans never write remotely. Only explicitly reviewed `apply` commands can publish, with bounded targets and fresh revision checks. Badge practice and dated activity share one marked private workspace. Synthetic activity is not genuine employment evidence.

CI tests Node 22/24 across Linux, macOS and Windows, package installation, and **read-only** live GitHub access. Private remote writes are mocked or tested against local Git repositories—not proven in a real private GitHub account.

[Commands](CLI.md) · [Security](../SECURITY.md)
