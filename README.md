# GH Aura

A free, local-first CLI for inspecting GitHub activity and badges, planning clearly labeled private practice, and presenting your actual project work. One user-owned private workspace is reused when explicitly approved.

**Node.js 22+ · Zero runtime dependencies · No dashboard or required AI**

## Install

[Download the latest GitHub Release](https://github.com/ibbuilds/gh-aura/releases/latest) or run directly from source:

```bash
git clone https://github.com/ibbuilds/gh-aura.git
cd gh-aura
npm link
gh-aura init YOUR_USERNAME
```

The package is distributed via GitHub Releases, not the npm registry.

## Four main commands

```bash
gh-aura activity 2022           # Inspect observed contributions for 2022
gh-aura badges free             # Free achievement opportunities
gh-aura readme minimal          # Minimal profile README draft
gh-aura pins --goal "backend"   # Project recommendations
```

All four commands are read-only. The original `contributions`, `achievements`, `profile`, and `showcase` commands remain supported.

## Private achievement workflow (optional)

GH Aura maps **19 known achievement/highlight entries**. The three private-workspace event candidates are Pull Shark, YOLO and Quickdraw. Start with a reviewed 2-PR pilot using `gh-aura badges auto --tier base --output base.json`; after checking GitHub's actual award, `gh-aura badges auto next --goal max --output next.json` safely plans the next stage toward Pull Shark Gold (1,024 PRs) without guessing indices or writing to GitHub. Every batch requires separate approval. Within each confirmed run GH Aura reuses the last verified merge SHA, avoids redundant sleeps and keeps an atomic local 480-content-write/hour budget per authenticated account. These optimizations do not bypass GitHub's own rate limits. `badges auto status` reports only observable events, including review-free self-merges and five-minute issue closes—not awarded badges. [Matrix](docs/ACHIEVEMENTS.md) · [Runner](docs/BADGE_RUN.md).

**Activity** also plans dated, explicitly synthetic practice with `gh-aura activity plan 2022 --density 70 --output plan.json`. After approving its fingerprint, `activity apply` creates or safely reuses the same owned private workspace as `badges auto`. GitHub alone decides what appears in your contribution graph. [Activity guide](docs/CALENDAR.md).

## Review before publishing

```bash
gh-aura readme regular --language es --output draft.md
gh-aura check --file draft.md
gh-aura preview --file draft.md --save review.json
gh-aura apply --review review.json --pr
```

`--pr` opens a **reviewable, unmerged pull request** for your public `USERNAME/USERNAME` profile README. Without it, `apply` commits the exact approved README directly. Both require a scoped GitHub token and live revision checks.

## Targeted improvements

```bash
gh-aura audit --goal "Backend Engineer" --inspect 3 --deep 2
gh-aura audit --job vacancy.txt                # Local job description; never uploaded
gh-aura contributions --all --recover           # Genuine history and attribution guide
gh-aura contributions --local .                 # Offline Git author-email diagnosis
gh-aura story set USER/PROJECT --contribution "What I built"
gh-aura achievements --prepare pull-shark --repo USER/PROJECT
gh-aura references                              # Offline professional profile references
```

To propose **your own useful documentation change** in an authorized repository:

```bash
gh-aura work preview --repo USER/PROJECT --path README.md --file revision.md --save work.json
gh-aura work apply --review work.json
```

This creates an unmerged PR, never a guaranteed achievement. Profile styles are `minimal`, `regular`, and `flashy`; `readme 0..100` also controls visual intensity. All sections and featured projects are configurable.

## Reference study and limits

GH Aura's editorial reference uses [200 public, ordinary-visibility engineering profiles](research/ORDINARY_STUDY.md) from 35 company GitHub organizations. Company membership and self-described work are **signals, not independently verified employment**. Their structure is summarized offline; no biographies are copied or profiles fetched during normal CLI use.

GitHub decides which events count toward contributions and achievements. GH Aura cannot guarantee badges, historical activity, job offers or code quality; public repo pins are selected through GitHub's interface. No background jobs or unattended profile changes. Synthetic activity is labeled and requires separate approval; one marked private workspace can be reused. Never delete it casually.

Public reads use a five-minute cache, explicit API budgets and optional `--stats` reporting. Publishing never uses cached revisions. No subscription or paid API is necessary.

## Documentation

[Command reference](docs/CLI.md) · [Architecture](docs/ARCHITECTURE.md) · [Security](SECURITY.md) · [Contribution guide](CONTRIBUTING.md) · [Changelog](CHANGELOG.md) · [Research](research/README.md)

```bash
npm run check && npm test && npm run test:package
```

MIT licensed.
