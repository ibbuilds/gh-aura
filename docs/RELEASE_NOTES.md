# GH Aura 1.2.0

Measured resource use and evidence-grounded writing, without a server or mandatory AI provider.

## Install

Requires Node.js 22+. Install the attached tarball with `npm install --global ./gh-aura-1.2.0.tgz`. This is a GitHub Release, not an npm registry publication. The checksum is in `SHA256SUMS.txt`.

## Changes

- Separate lazy command handlers for local work, public reads and reviewed publication.
- Add read request/stream-byte budgets, `--budget` and token-free `--stats`.
- Skip unused existing-profile reads during plain README generation. A deterministic fixture falls from 4 HTTP calls to 2; warm reads remain at 0.
- Add visual intensity 0–100, editorial preferences, compact evidence briefs, ready-to-use writing prompts and offline draft checks.
- Ground structural guidance in a reproducible 100-account public-contributor study across 12 projects. Source hashes and limitations are recorded; no biography text is copied or shipped.
- Add budget, editorial, cohort-integrity and actual CLI live-read regression gates.

## Workflow

```bash
gh-aura init YOUR_USERNAME
gh-aura audit --inspect 6 --stats
gh-aura profile --visual 20 --output draft.md
# Or export grounded instructions for your own writer:
gh-aura brief --prompt --output writer.txt
gh-aura check --file draft.md
gh-aura preview --file draft.md --save review.json
# Only after reviewing the diff:
gh-aura apply --review review.json --pr
```

The writer remains optional and external. No badge guarantees, fabricated historical activity or professional-identity claims are generated. Visual percentages are presentation controls, not credibility scores. Pins and account settings stay manual; publication requires a separately approved draft and scoped token.

CI checks all supported OS/Node combinations, packed installation and live public reads. Publication behavior is tested with isolated fixtures, never by modifying a personal profile.
