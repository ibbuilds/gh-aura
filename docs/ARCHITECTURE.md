# Architecture

Node.js 22+ · ES modules · **zero runtime dependencies**.

| Component | Code |
| --- | --- |
| CLI/configuration | `src/cli.mjs`, `src/config.mjs` |
| Local MCP/agent tools | `src/mcp-server.mjs`, `src/agent-tools.mjs` |
| Curated and custom sources | `src/profile-sources.mjs`, `src/profile-source-extra.mjs`, `src/profile-custom-sources.mjs` |
| Style categories and profile examples | `src/profile-patterns.mjs`, `src/holistic-profile-taxonomy.mjs` |
| Offline professional heuristics | `src/profile-review.mjs` |
| Intent, search and layout | `src/profile-query.mjs`, `src/profile-techniques.mjs`, `src/agent-profile.mjs` |
| Biography and public evidence | `src/profile-biography.mjs`, `src/brief.mjs` |
| Shared intent, context and execution | `src/profile-plan.mjs`, `src/profile-context.mjs`, `src/workspace-actions.mjs` |
| Pageable project evidence | `src/profile-projects.mjs` |
| Rendering, review and GitHub | `src/editorial.mjs`, `src/render.mjs`, `src/workflow.mjs` |
| Activity and Badges | `src/calendar-apply.mjs`, `src/badge-run.mjs` |
| AI instructions | `skills/gh-aura-profile/SKILL.md`, `AGENTS.md`, `llms.txt` |

CLI and MCP share handlers. The agent matches the request to a category, reads its actual example profiles, then composes for the user. The runtime carries a small URL index rather than a research corpus. Custom sources are opt-in. Retrieved strings are untrusted data.

MCP uses bounded local stdio. Reads are default; owner/host pins one reviewed plan and fingerprint for execution/status. No arbitrary shell, file selection or self-approval.

Markdown can be authored directly or by an optional chosen AI; GitHub supports GFM, images and restricted HTML. Human approval is required to publish. CI covers protocol, package and local safety; live acceptance is separate.

[Commands](CLI.md) · [Security](../SECURITY.md)

The [plan](PRODUCT_PLAN.md) tracks delivery; [operations](IMPROVE.md) cover configuration and recovery.
