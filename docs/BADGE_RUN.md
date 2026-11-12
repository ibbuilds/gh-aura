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

`--tier base|bronze|silver|gold` chooses a **first-party profile-fragment-observed threshold** of 2/16/128/1,024. YOLO and Quickdraw have no higher documented tiers. `--goal max` is only supported by read-only `auto next` and stages all four Pull Shark milestones; actual earned badges must be checked manually before continuing. `--start` is the **index of exercises in the selected workspace**, not a count of earned badges or all of your account's merged PRs.

Plans are fully offline and include the exact repo, the requested operations, all sixteen excluded categories, bounds, estimated maximum request count, next batch position, and a SHA-256 fingerprint. Default/no-tier behavior remains compatible with earlier `--pulls 0..16 --start 0..1023` plans. A batch can only include exercises 1..1,024; there is no unattended loop.

## Apply only after approval

```bash
# Read the full JSON and fingerprint first:
gh-aura badges auto apply --review bronze.json --confirm THE_64_CHARACTER_FINGERPRINT
```

Apply requires a token able to create a private repo if needed, then use Contents, Pull requests and Issues permissions in that workspace. Every batch:
- Verifies authenticated ownership, private visibility, non-fork status and the GH Aura workspace README marker (existing unmarked repos are never adopted).
- Checks the default-branch exercise file before opening a PR; already merged exercises are skipped on replay.
- Creates bounded synthetic exercise PRs, verifies no submitted GitHub reviews and merges only the exact expected head SHA, **if repository protections permit**.
- Searches issue-history pages before opening Quickdraw's labeled issue; verifies actual creation/closure timestamps where supplied; incomplete evidence fails closed rather than creating duplicates.
- Performs serial mutative requests at least **1 second apart** and reserves them in a locally persisted **480/hour sliding-window ledger per authenticated account** (across repeated CLI processes on one machine). GitHub's own general guidelines are approximately **80 content creations/minute** and **500/hour**, with stricter secondary or account-wide limits possible. Never force-pushes, edits other repos, deletes a repo or retries uncertain writes automatically.
- Reuses GitHub's confirmed default-branch SHA from one squash merge as the base of the next exercise PR, saving one GET per additional PR. If a completed exercise is skipped, it re-fetches the branch head. Previously redundant fixed sleeps are removed; the one-second mutation spacing remains.

For higher tiers, ask GH Aura to derive the next batch from the actual private workspace rather than manually guessing `--start`:

```bash
# Read-only private GitHub API checks; requires GH_TOKEN / GITHUB_TOKEN
gh-aura badges auto next --goal max --output next.json
# Review the new SHA-256 plan first; then separately authorize:
gh-aura badges auto apply --review next.json --confirm FINGERPRINT
```

`auto next --goal max` chooses the **next** reported milestone (base 2, Bronze 16, Silver 128, Gold 1,024) from observed completed exercises; it does not attempt Gold from zero in one shot. It verifies exact workspace ownership and marker, completed GH Aura PRs, an untruncated Git tree, gap-free matching exercise files and absence of pending branches. It never creates a repository or performs GitHub writes. If the workspace already meets the **reported** target by observed exercise events, it reports a local target reached and creates no plan; this is **not a GitHub-awarded tier**. If evidence is incomplete or inconsistent, it stops rather than guessing.

Existing exercise paths are skipped on replay, and merged PRs do not imply that GitHub has attributed an achievement.

## Read observed events, not alleged badges

```bash
gh-aura badges auto status
# Or explicitly:
gh-aura badges auto status --repo YOUR_USERNAME/my-gh-aura-private
```

This **read-only** command checks the exact marked private workspace, paging through up to twelve pages each of closed PRs and issues. It counts merges authored by the account from GH Aura's exercise branches, plus bounded inspection of the PR merger and formal reviews for a YOLO event candidate. It measures five-minute Quickdraw timing from GitHub's actual timestamps. If a result list is truncated, it marks completeness false. A local Pull Shark tier candidate is only a workspace event count; **it is not confirmation of a badge**. Check `https://github.com/YOUR_USERNAME?tab=achievements` with the appropriate visibility settings.

## Deliberate exclusions and limits

- Pair Extraordinaire needs a real consenting collaborator; Galaxy Brain needs somebody else to accept authentic answers; Starstruck needs independent public stars.
- Public Sponsor requires payment; disabled/historical/staff/program badges are not obtainable through this sandbox.
- Deleting a shared workspace risks losing history and potentially contribution evidence; **no automatic deletion is available**.
- GitHub can withhold, defer or change award eligibility without notifying this tool.
- Remote write operations are mocked in CI and must be verified against an **authorized disposable test account** before claiming production success.

[Full mapped catalog](ACHIEVEMENTS.md) · [Privacy and security](../SECURITY.md) · [Validation checklist](RELEASE_READINESS.md)

## Throughput: what can and cannot be made faster

The current REST workflow requires approximately **four GitHub content-changing API requests per PR** (branch ref, file commit, open PR, merge), plus read-only verification. For 1,024 PRs that is roughly **4,096 writes**, excluding workspace setup and Quickdraw. At GitHub's general 500 content-generating writes/hour secondary guideline the optimistic theoretical minimum is about **8.2 hours**; the CLI's locally tracked 480/hour allowance is more conservative. Actual limits may be lower, and **none of the exercise events is guaranteed to earn a badge**.

GH Aura optimizes the unnecessary reads and waits, not the GitHub eligibility requirements. In an uninterrupted 16-PR batch it avoids **15 default-branch GETs** by using the merge SHA just confirmed by GitHub. It does not dispatch parallel mutative calls or game rate limiting, because GitHub explicitly recommends serialized writes with a pause of at least one second.

The local ledger uses a hashed account key at `~/.cache/gh-aura/badge-write-budget/`, without secrets, and survives separate CLI invocations. When its rolling hourly limit is exhausted, the next action refuses **before** sending a new mutation and reports an approximate number of minutes to wait. A failed or uncertain write still reserves a slot. **Quickdraw reserves the create-and-close pair together before creating an issue**, so hitting the local hourly limit cannot leave the issue open before its five-minute deadline. This protects only GH Aura on the **same machine**; account activity elsewhere still counts toward GitHub's actual limits. There are no unattended retries or automatic batch chaining.
