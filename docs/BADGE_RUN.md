# Badges — approved private achievement exercises

GH Aura can perform the **three controllable categories of GitHub events** that may qualify for achievements in one authenticated account's marked private workspace: merged self-owned PRs (Pull Shark), unreviewed self-merge (YOLO) and promptly closed QA issues (Quickdraw).

These are **attempts, not awards**. GitHub's private-event eligibility and anti-abuse/rule logic are not completely documented. The tool never modifies unrelated existing repos, bypasses branch protection, creates accounts, requests stars, fakes coauthors or makes payments.

## Setup once

```bash
gh-aura init YOUR_USERNAME
# Default private workspace: YOUR_USERNAME/gh-aura-workspace
# Optional persistent override:
gh-aura config set workspace.repo YOUR_USERNAME/my-gh-aura-private
```

Setup does not create the repo. The first explicitly confirmed apply creates it if absent; subsequent operations reuse the **same** private, owned, GH Aura-marked workspace, including one already created by `activity apply`. Public, forked, archived, unmarked or other-user repos are refused.

## Choose the Pull Shark target and review

```bash
# Base (reported 2 PRs), plus YOLO and Quickdraw exercise attempts
gh-aura badges auto --tier base --output base.json

# Or plan up to 16 PR exercises in one batch (reported Bronze milestone)
gh-aura badges auto --tier bronze --output bronze.json

# Later non-overlapping Silver progression, 16 PRs at a time
gh-aura badges auto --tier silver --start 16 --output silver-16.json

# Gold reported threshold 1,024; batches are still limited to 16
gh-aura badges auto --tier gold --start 128 --output gold-128.json
```

`--tier base|bronze|silver|gold` chooses a **community/product-observed threshold** of 2/16/128/1,024. `--start` is the **index of exercises in the selected workspace**, not a count of earned badges or all of your account's merged PRs.

Plans are fully offline and include the exact repo, the requested operations, all sixteen excluded categories, bounds, estimated maximum request count, next batch position, and a SHA-256 fingerprint. Default/no-tier behavior remains compatible with earlier `--pulls 0..16 --start 0..1024` plans. A batch can only include exercises 1..1,024; there is no unattended loop.

## Apply only after approval

```bash
# Read the full JSON and fingerprint first:
gh-aura badges auto apply --review bronze.json --confirm THE_64_CHARACTER_FINGERPRINT
```

Apply requires a token able to create a private repo if needed, then use Contents, Pull requests and Issues permissions in that workspace. Every batch:
- Verifies authenticated ownership, private visibility, non-fork status and the GH Aura workspace README marker (existing unmarked repos are never adopted).
- Checks the default-branch exercise file before opening a PR; already merged exercises are skipped on replay.
- Opens bounded synthetic exercise PRs and merges them with GitHub's standard endpoint **only if repository rules permit**.
- Searches issue-history pages before opening Quickdraw's labeled issue; uncertain or truncated history fails closed instead of blindly creating duplicates.
- Never force-pushes, edits other repos, deletes a repo or retries uncertain writes automatically.

For higher tiers, check the status and manually plan the **next** batch with the correct `--start`. Existing exercise paths are skipped, and merged PRs do not imply that GitHub has attributed an achievement.

## Read observed events, not alleged badges

```bash
gh-aura badges auto status
# Or explicitly:
gh-aura badges auto status --repo YOUR_USERNAME/my-gh-aura-private
```

This **read-only** command checks the exact marked private workspace, paging through up to twelve pages each of closed PRs and issues. It counts merges made by the authenticated owner from GH Aura's exercise branches and closed labeled QA issues. If a result list is truncated, it marks completeness false. A local Pull Shark tier candidate is only a workspace event count; **it is not confirmation of a badge**. Check `https://github.com/YOUR_USERNAME?tab=achievements` with the appropriate visibility settings.

## Deliberate exclusions and limits

- Pair Extraordinaire needs a real consenting collaborator; Galaxy Brain needs somebody else to accept authentic answers; Starstruck needs independent public stars.
- Public Sponsor requires payment; disabled/historical/staff/program badges are not obtainable through this sandbox.
- Deleting a shared workspace risks losing history and potentially contribution evidence; **no automatic deletion is available**.
- GitHub can withhold, defer or change award eligibility without notifying this tool.
- Remote write operations are mocked in CI and must be verified against an **authorized disposable test account** before claiming production success.

[Full mapped catalog](ACHIEVEMENTS.md) · [Privacy and security](../SECURITY.md) · [Validation checklist](RELEASE_READINESS.md)
