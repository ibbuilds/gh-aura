# GH Aura: AI tools and CLI

`gh-aura COMMAND --help` gives full options. AI tools can read, guide, validate and preview but **never publish**.

## Connect an AI agent

Local MCP stdio command: `gh-aura mcp`. Compatible client example:

```json
{"mcpServers":{"gh-aura":{"command":"gh-aura","args":["mcp"]}}}
```

Or use the [portable Agent Skill](../skills/gh-aura-profile/SKILL.md) in an agent that supports Skills. Other models can consume `gh-aura brief --prompt`.

## Sources and design techniques

```bash
gh-aura sources list --json
gh-aura sources recommend --query "biografía sobria" --json
gh-aura sources design --query "terminal y pixel art" --direction expressive --json
gh-aura sources show github-diagrams --json
gh-aura sources recommend --query "iconos" --external --json
```

Sources have URLs, licensing and maintenance caveats; techniques are **composable building blocks, not READMEs to paste**. Third-party and user-supplied sources require `--external` to be recommended.

To add your own trusted reading references, create a JSON file:

```json
{"format":"gh-aura-custom-sources-v1","sources":[{"id":"my-art","title":"My licensed artwork","url":"https://example.org/art","category":"design","tags":["pixel","hero"],"license":"Author permission"}]}
```

Use `gh-aura sources list --catalog ./sources.json --json` or set `GH_AURA_SOURCES_FILE=/absolute/sources.json` for the MCP process. GH Aura does not open URLs, copy biographies or auto-embed artwork.

## Biography and original composition

```bash
gh-aura agent capabilities --json
gh-aura agent spec --goal "backend" --direction technical --visual-brief "One code block, no charts"
gh-aura agent bio --voice editorial --perspective first-person --focus research --bio-words 70
gh-aura brief --prompt --direction expressive --external --output prompt.md
```

Four direction hints: `barebones`, `minimal`, `technical`, `expressive`. Voice, narrative focus, media, claims, project order, paragraphs and technology evidence are independently configurable through the editable ProfileSpec and MCP tools. Claims supplied by the user are **not** automatically verified.

## Core GitHub functions

```bash
gh-aura activity 2022
gh-aura badges free
gh-aura readme minimal --output draft.md
gh-aura pins --goal "backend" --limit 6
gh-aura audit --goal "backend" --inspect 3 --deep 2
```

## Review before publishing

```bash
gh-aura check --file draft.md --strict
gh-aura preview --file draft.md --save review.json
gh-aura apply --review review.json --pr
```

Only the owner can authorize GitHub writes. Synthetic `activity apply` and `badges auto apply` require separate, fingerprint-reviewed private workspace plans. No agent can infer actual awards from repository events.

[Agent guidance](../AGENTS.md) · [Architecture](ARCHITECTURE.md) · [Security](../SECURITY.md)
