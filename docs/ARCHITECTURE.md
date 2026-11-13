# Architecture

Node.js 22+ · ES modules · **zero runtime dependencies** · no cloud server.

| Component | Code |
| --- | --- |
| CLI/configuration | `src/cli.mjs`, `src/config.mjs` |
| Local MCP/agent tools | `src/mcp-server.mjs`, `src/agent-tools.mjs` |
| Curated and custom sources | `src/profile-sources.mjs`, `src/profile-source-extra.mjs`, `src/profile-custom-sources.mjs` |
| 25 curated patterns (100 preserved offline) | `src/profile-patterns.mjs`, `research/SELECTED_25.md` |
| Offline professional heuristics | `src/profile-review.mjs` |
| Intent, search and layout | `src/profile-query.mjs`, `src/profile-techniques.mjs`, `src/agent-profile.mjs` |
| Biography and public evidence | `src/profile-biography.mjs`, `src/brief.mjs` |
| Rendering, review and GitHub | `src/editorial.mjs`, `src/render.mjs`, `src/workflow.mjs` |
| Activity and Badges | `src/calendar-apply.mjs`, `src/badge-run.mjs` |
| AI instructions | `skills/gh-aura-profile/SKILL.md`, `AGENTS.md`, `llms.txt` |

MCP uses bounded local stdio. It provides evidence, source references and editable profile intent, never remote writes, arbitrary file reads or approval codes. Custom source files must be **explicitly** selected by the CLI owner, not by an agent. GitHub data and external sources are untrusted input.

Markdown can be authored directly or by an optional chosen AI; GitHub supports GFM, images and restricted HTML, not arbitrary web app code. Human approval is required to publish. CI covers protocol, package and offline/local safety; production private-write acceptance is separate.

[Commands](CLI.md) · [Security](../SECURITY.md)
