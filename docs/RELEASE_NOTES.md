# GH Aura v1.9.0

**One CLI, one reusable private workspace.** GH Aura continues to run locally with Node.js 22+, zero runtime dependencies, no subscription and no mandatory AI.

## Install

Download `gh-aura-1.9.0.tgz` and `SHA256SUMS.txt` from the GitHub Release, check the checksum, then:

```bash
npm install --global ./gh-aura-1.9.0.tgz
gh-aura init YOUR_USERNAME
```

The package is distributed through GitHub Releases, not the public npm registry.

## Unified activity commands

```bash
# Observed history remains read-only.
gh-aura activity 2022

# Offline synthetic date plan.
gh-aura activity plan --from 2022-07-01 --to 2022-07-31 --density 100 \
  --intensity 1 --output plan.json

# Inspect the plan and fingerprint first, then explicitly approve.
gh-aura activity apply --review plan.json --confirm FINGERPRINT \
  --author-name "Your Display Name" --author-email YOUR_VERIFIED_EMAIL
```

`calendar plan/apply` continues working as a legacy alias, but no longer has separate product branding. Date, intensity, weekend, progression and existing-history options remain available. `--density 100` now selects all eligible empty dates even when weekend weighting is zero.

## One owned private workspace, reused

After `gh-aura init YOUR_USERNAME`, the default workspace is `YOUR_USERNAME/gh-aura-workspace`. Use `gh-aura config set workspace.repo YOUR_USERNAME/PRIVATE_NAME` if needed. No repository is created until the first fingerprint-approved remote apply.

- The first `activity apply` creates a private, owned, marked GitHub repository and one generated Git history.
- Later `activity apply` commands reuse the same repo, fetch its latest default branch, reject duplicate generated paths and unsafe/unmarked targets, and append **without force push**. They preserve existing Git history.
- `gh-aura badges auto` uses that **same** workspace by default. It can create and merge bounded private exercise PRs and close an exercise QA issue, but does **not** guarantee an achievement.

Any existing unmarked repository is rejected. The tool does not edit unrelated repositories, rewrite old commits, automatically remove work or alter GitHub account visibility settings.

## Security and reality checks

GitHub decides whether dated synthetic commits qualify for profile contributions, what appears on the graph and which achievements are awarded. The generated exercises are labeled synthetic and are **not verified professional history**. A successful push or PR merge is not confirmation of a green calendar square or badge.

Private-repository creation/reuse and Git push are covered by unit tests, simulated API calls and local Git repository tests. Real, authorized remote-write validation is still pending; `npm run test:live` remains strictly read-only. Do **not** delete a shared workspace to clean up badges: it may contain activity history and GitHub's treatment of deleted evidence is not guaranteed.

## Documentation

[Activity workspace](https://github.com/ibbuilds/gh-aura/blob/main/docs/CALENDAR.md) · [Badges](https://github.com/ibbuilds/gh-aura/blob/main/docs/BADGE_RUN.md) · [CLI](https://github.com/ibbuilds/gh-aura/blob/main/docs/CLI.md) · [Release readiness](https://github.com/ibbuilds/gh-aura/blob/main/docs/RELEASE_READINESS.md)
