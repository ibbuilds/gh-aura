# GH Aura v1.8.0

**Calendar Studio + private Achievement workflow automation.** GH Aura remains a local CLI on Node.js 22+, with no runtime dependencies, hosted backend, paid API or mandatory AI model.

## Install

Download `gh-aura-1.8.0.tgz` and `SHA256SUMS.txt` from this GitHub Release, verify the checksum and install:

```bash
npm install --global ./gh-aura-1.8.0.tgz
gh-aura init YOUR_USERNAME
```

This package is distributed on GitHub Releases, **not the public npm registry**.

## New: Calendar Studio

```bash
# One year with 70% target active dates
gh-aura calendar plan 2022 --density 70 --output calendar.json

# Multi-year gradually rising activity, fewer weekend sessions
gh-aura calendar plan --from 2020 --to 2025 --density 75 --growth 65 \
  --weekends 20 --intensity 3 --mode workweek --seed 42 --output years.json

# Preserve dates already observed on your public GitHub contribution graph
gh-aura contributions --all --days --json --output history.json
gh-aura calendar plan 2022 --density 80 --existing history.json --output gaps.json

# ONLY after reviewing exact plan and SHA-256 fingerprint:
gh-aura calendar apply --review calendar.json --repo YOUR_USERNAME/NEW_PRIVATE_REPO \
  --author-name "Your Display Name" --author-email YOUR_GITHUB_EMAIL \
  --confirm FINGERPRINT
```

The deterministic planner works **offline**. Remote apply creates a **new, owned private repository** only (never an existing one), builds the generated history using local Git fast-import and performs one Git push. Dates must be within the GitHub account lifetime; at most 20 calendar years/2,500 commits are allowed per plan.

**Generated commits are clearly labeled synthetic practice, not verified past professional work.** GitHub decides contribution attribution based on author identity, eligible branches, dates and private-visibility settings. No historical activity is guaranteed to appear.

## New: private owned achievement workflow runner

```bash
# Plan without a token, then explicitly authorize the operation
gh-aura badges auto --repo YOUR_USERNAME/aura-achievements --pulls 2 --output badges.json
gh-aura badges auto apply --review badges.json --confirm FINGERPRINT
```

The runner creates (or resumes) one **owned, marked private sandbox** and can merge generated technical exercise PRs (events associated with Pull Shark and potentially YOLO) and open/close one labeled QA issue (Quickdraw attempt). The operations are bounded to 0–16 PRs per command, idempotent when previously merged, and subject to GitHub permissions/protections. No public repo, third-party account or unmarked repository is touched.

**GitHub alone awards Achievements; private or self-owned events may not qualify.** Pair Extraordinaire, Galaxy Brain, Starstruck and paid/historical achievements are excluded because the required results are not fully under one private account's control.

## Security / tests

- All read-only CLI commands remain backward compatible: `activity`, `badges free`, `readme`, `pins`, `audit`, `story`, `work`.
- New plan commands do not access GitHub or write to a repository. Apply requires a fingerprint, an appropriate free GitHub token and exact private ownership checks.
- No token is embedded in Git URLs or command arguments, local plans or profile README drafts.
- No force pushes, existing-history rewrites, account settings modifications, hidden scheduling or automatic third-party engagement.
- Unit/integration tests verify date curves, historical gap preservation, Git fast-import/local bare-repo push, mock GitHub private repository creation, automatic PR/issue operations, replay protection and permission boundaries.
- CI runs Node 22/24 on Linux, macOS and Windows, packed CLI smoke tests, and live strictly **read-only** GitHub integration. CI does not create a real private repo or award a badge.

[Calendar Studio guide](https://github.com/ibbuilds/gh-aura/blob/main/docs/CALENDAR.md) · [Badge runner guide](https://github.com/ibbuilds/gh-aura/blob/main/docs/BADGE_RUN.md) · [Security](https://github.com/ibbuilds/gh-aura/blob/main/SECURITY.md)
