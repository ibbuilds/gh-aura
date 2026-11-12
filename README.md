# GH Aura

**AI-first GitHub profile toolkit.** Create an original, professional README with your own AI. GH Aura provides real project context, composition techniques, curated resources, biography controls and read-only previews—not fixed templates.

**Node.js 22+ · Free · Zero runtime dependencies**

## Install

[Latest GitHub Release](https://github.com/ibbuilds/gh-aura/releases/latest), or:

```bash
git clone https://github.com/ibbuilds/gh-aura.git
cd gh-aura
npm link
gh-aura init USERNAME
```

## Build with any AI

Connect an MCP-compatible client to `gh-aura mcp`:

```json
{"mcpServers":{"gh-aura":{"command":"gh-aura","args":["mcp"]}}}
```

Alternatively, load the [Agent Skill](skills/gh-aura-profile/SKILL.md), or export a portable prompt. Tell your AI what you want in ordinary language; the layout and biography remain yours.

```bash
gh-aura sources recommend --query "biografía minimalista" --json
gh-aura sources design --query "terminal retro" --direction expressive --json
gh-aura agent bio --voice technical --focus engineering --bio-words 70
gh-aura agent spec --direction technical --visual-brief "Clean, original, 2 projects"
gh-aura brief --prompt --direction technical --output prompt.md
```

**30 curated references and 25 layout techniques**, plus optional user-supplied resources in a local JSON file. External image providers are opt-in; GitHub's Markdown rules still apply. No AI vendor, paid API or template is required.

## Traditional CLI

```bash
gh-aura activity 2022           # Observed contributions
gh-aura badges free             # Achievement eligibility
gh-aura readme minimal -o me.md # Deterministic draft without AI
gh-aura pins --goal "backend"   # Public project recommendations
```

## Publish only after your own review

```bash
gh-aura check --file me.md
gh-aura preview --file me.md --save review.json
gh-aura apply --review review.json --pr
```

The AI **cannot approve or publish**. `--pr` opens a reviewable, unmerged PR. Pins remain manual. Optional Activity/Badge exercises use one owned, marked private workspace and separate approvals; GitHub does not guarantee awards.

[AI and CLI](docs/CLI.md) · [Source/biography safety](SECURITY.md) · [Product status](docs/PRODUCT_PLAN.md)

Only the newest GitHub Release retains downloadable assets; historical Git tags remain. MIT.
