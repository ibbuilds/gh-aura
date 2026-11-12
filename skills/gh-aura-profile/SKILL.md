---
name: gh-aura-profile
description: Create or refine an original professional GitHub profile README using GH Aura’s evidence-aware CLI, curated sources and safe review workflow. Use for GitHub profile design, hiring-oriented README content, profile audits, art direction, repo highlights and source research.
license: MIT
compatibility: Node.js 22+ and GH Aura CLI on PATH; GitHub network access for live profile inspection; MCP optional
metadata:
  product: gh-aura
  version: "1"
---

# GH Aura professional profile workflow

An agent should **compose an original README**, never copy another person's profile or fill a fixed template. Ask what the user wants to communicate; prefer verified projects and a clear specialty to decorative effects.

1. **Discover:** `gh-aura agent capabilities --json` or MCP `tools/list`; use the capabilities that are actually available in this environment.
2. **Read:** `gh-aura brief --json` or MCP `gh_aura_profile_context`; inspect public repos via `gh-aura pins --goal "ROLE" --json`. Missing evidence stays unknown.
3. **Choose a direction:** `gh-aura agent spec --direction barebones|minimal|technical|expressive --goal "ROLE"` or MCP `gh_aura_profile_plan`. Adjust word budget, projects and section toggles independently.
4. **Find sources:** `gh-aura sources recommend --query "icons|ci|markdown" --direction technical --json` or MCP `gh_aura_sources_search`. Get source details before using it. Default to GitHub-native Markdown. Ask before adding third-party SVG badges, cards or dynamic images; review license, maintenance and privacy notes.
5. **Write:** The AI authors fresh Markdown using the user’s preferences, the profile intent and current evidence. For additional guidance run `gh-aura brief --prompt --direction technical`. Do not pass tokens to model context.
6. **Iterate:** Use MCP `gh_aura_profile_refine` for updated intent, then revise Markdown. Never lose user-selected projects or links without permission.
7. **Validate:** `gh-aura check --file draft.md --strict` or MCP `gh_aura_profile_validate`; repair placeholders, unsupported claims and broken links. The checks are heuristics, not a factuality or originality certificate.
8. **Preview:** MCP `gh_aura_profile_preview` or `gh_aura_profile_diff` returns a **read-only** diff. Show the final Markdown to the user.
9. **Human-controlled publication:** After the user saves and reads the draft, **the user independently runs** `gh-aura preview --file draft.md --save review.json` and `gh-aura apply --review review.json --pr`. The agent's tools never publish and do not mint an approval token.

For activity, achievements and pins, expose GitHub’s observations and limitations, not invented progress or automated claims of employment. The separate badge sandbox is synthetic; awards are decided by GitHub. Never create another user's tokens or fake collaborations.

If this agent cannot execute the CLI or connect MCP, give the user a portable editing brief and instructions; do not claim that GH Aura inspected their account.
