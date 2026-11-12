# GH Aura v1.6.0

**CLI-only, local-first GitHub profile enhancement with user-approved actions.** No paid API, hosted dashboard, mandatory AI provider, telemetry or background activity.

## Install

Requires Node.js 22+. Download the attached `gh-aura-1.6.0.tgz` and `SHA256SUMS.txt` from this GitHub Release and verify the checksum.

```bash
npm install --global ./gh-aura-1.6.0.tgz
gh-aura init YOUR_USERNAME
```

The package is distributed via GitHub Releases; it is not in the public npm registry.

## Changes since v1.5.1

**1. Real local Git attribution review**

```bash
gh-aura contributions --local .
gh-aura contributions --local . --emails-file historical-identities.txt
```

Inspect original local Git author metadata without any GitHub API call, printing private email addresses, modifying commits or claiming this guarantees GitHub contribution graph credit. The scan caps at 5,000 commits and reports shallow history and unknown ownership.

**2. Reviewed documentation PRs**

```bash
gh-aura work preview --repo OWNER/PROJECT --path docs/setup.md --file revised.md --save review.json
gh-aura work apply --review review.json
```

Use a scoped GitHub token to open an **unmerged PR** with exactly one user-authored Markdown change. Full diff review, current repository visibility/revision, exact content fingerprint and single-file checks are required. Private repos require explicit opt-in. No auto-merge, filler commits, synthetic awards or unreviewed code changes.

**3. Source-linked CI and release context**

```bash
gh-aura audit --deep 2 --checks --stats
```

Optional extra GitHub API requests show the latest observed Actions run and release for selected projects, with source links. A previous successful run does **not** prove the current code works. Without `--checks`, the normal bounded tree inspection remains unchanged.

**4. Simple project-story commands**

```bash
gh-aura story set YOUR_USERNAME/project --contribution "Built the API authentication flow" --proof https://github.com/YOUR_USERNAME/project
gh-aura story list
gh-aura story remove YOUR_USERNAME/project --dry-run
```

Project summaries and personal claims stay in local configuration until the owner explicitly previews and publishes their profile README. No external requests or new runtime dependencies.

## Validation and limits

Tests cover Linux, macOS and Windows with Node 22 and 24, packed installation, mocked publish conflict/replay/privacy cases and real **read-only** GitHub integration. The new human-review study protocol is documented in [docs/HUMAN_VALIDATION.md](https://github.com/ibbuilds/gh-aura/blob/main/docs/HUMAN_VALIDATION.md); it **does not** claim to contain results from real hiring managers yet.

GitHub alone grants achievements, decides contribution graph eligibility and controls profile pins. GH Aura does not create historical fake activity, guarantee awards or alter any user's profile without explicit reviewed authorization.

Source: [README](https://github.com/ibbuilds/gh-aura/blob/main/README.md) · [Changelog](https://github.com/ibbuilds/gh-aura/blob/main/CHANGELOG.md).
