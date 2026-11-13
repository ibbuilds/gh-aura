# Architecture

Node.js 22+ · ES modules · **zero runtime dependencies**.

| Component | Code |
| --- | --- |
| CLI/configuration | `src/cli.mjs`, `src/config.mjs` |
| Local MCP/agent tools | `src/mcp-server.mjs`, `src/agent-tools.mjs` |
| Curated and custom sources | `src/profile-sources.mjs`, `src/profile-source-extra.mjs`, `src/profile-custom-sources.mjs` |
| Provisional reading references | `src/profile-patterns.mjs`; [immutable research archive](../research/README.md) |
| Offline professional heuristics | `src/profile-review.mjs` |
| Intent, search and layout | `src/profile-query.mjs`, `src/profile-techniques.mjs`, `src/agent-profile.mjs` |
| Biography and public evidence | `src/profile-biography.mjs`, `src/brief.mjs` |
| Shared intent, context and execution | `src/profile-plan.mjs`, `src/profile-context.mjs`, `src/workspace-actions.mjs` |
| Pageable project evidence | `src/profile-projects.mjs` |
| Rendering, review and GitHub | `src/editorial.mjs`, `src/render.mjs`, `src/workflow.mjs` |
| Activity and Badges | `src/calendar-apply.mjs`, `src/badge-run.mjs` |
| AI instructions | `skills/gh-aura-profile/SKILL.md`, `AGENTS.md`, `llms.txt` |

MCP uses bounded local stdio. CLI and MCP share the whole-profile handlers. Reads are default; owner/host pins one plan and fingerprint to expose only its execution/status. No arbitrary shell, file selection or self-approval. Custom sources and compiled pattern libraries are owner-configured. All retrieved strings are untrusted data.

Markdown can be authored directly or by an optional chosen AI; GitHub supports GFM, images and restricted HTML. Human approval is required to publish. CI covers protocol, package and local safety; live acceptance is separate.

[Commands](CLI.md) · [Security](../SECURITY.md)

The [product plan](PRODUCT_PLAN.md) tracks technical delivery and separate editorial/live acceptance. [Whole-profile operations](IMPROVE.md) document recovery and configuration.
