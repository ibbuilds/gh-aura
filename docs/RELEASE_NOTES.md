# GH Aura 1.7.1

Repository cleanup and packaging maintenance. No CLI behavior or command names change.

## Install

Requires Node.js 22+. Download `gh-aura-1.7.1.tgz` and `SHA256SUMS.txt` from this GitHub Release:

```bash
npm install --global ./gh-aura-1.7.1.tgz
gh-aura init YOUR_USERNAME
```

The package is distributed through GitHub Releases, **not** the npm registry.

## Changes

- Root README reduced to the actual start/review flow and four core commands.
- Command reference, architecture notes and product scope reorganized around **shipped** behavior instead of old proposals.
- Installable package now contains `src/`, the README, license, security policy, changelog and package metadata. Developer research, internal scripts and detailed documentation stay on GitHub, reducing downloaded bytes.
- Retired original project-contributor dataset/collector removed from the current tree; previous Git history retains it. The current 200-engineer cohort, 100-account provenance baseline and 16 employer-source observations are preserved.
- Added regression checks for package allowlisting and local Markdown links.
- One-time branch pruning is designed to run only on this explicitly named cleanup merge, using an allowlist with expected branch SHAs, without touching `main`.

## The supported workflow

```bash
gh-aura activity 2022
gh-aura badges free
gh-aura readme minimal --output draft.md
gh-aura pins --goal "backend engineer"
gh-aura preview --file draft.md --save review.json
# Only after inspecting and approving:
gh-aura apply --review review.json --pr
```

Existing advanced commands are unchanged. GH Aura does not autonomously update a profile, generate artificial history, grant GitHub achievements or merge a review PR.

## Validation

Syntax and offline tests; installed package smoke test; and real **read-only** GitHub integration on Node.js 22/24, Linux, macOS and Windows.

[Repository](https://github.com/ibbuilds/gh-aura) · [Commands](https://github.com/ibbuilds/gh-aura/blob/main/docs/CLI.md) · [Research](https://github.com/ibbuilds/gh-aura/tree/main/research)
