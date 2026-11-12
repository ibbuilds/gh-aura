# GH Aura v1.12.0

**Safe Gold progression for GitHub achievements, with exact-commit merge verification and rate-aware execution.** GH Aura remains a free, local-first Node.js 22+ CLI, one marked user-owned private workspace, zero runtime dependencies.

## Install

Download `gh-aura-1.12.0.tgz` and `SHA256SUMS.txt` from GitHub Releases, verify the checksum, then install:

```bash
npm install --global ./gh-aura-1.12.0.tgz
gh-aura init YOUR_USERNAME
```

No npm registry publication is required.

## Confirmed maximum targets

- Pull Shark: base **2**, Bronze **16**, Silver **128**, Gold **1,024** eligible merged PRs, reflected in first-party GitHub achievement-detail fragments.
- YOLO: **one** merge without a submitted review; no documented higher tiers.
- Quickdraw: **one** issue or PR closed within **five minutes** of opening; no documented higher tiers.

These are trigger/tier references, not guarantees that GitHub counts exercise actions in a self-owned private repository.

## Staged max-goal workflow

```bash
# Initial 2-PR pilot, with YOLO and Quickdraw event attempts
gh-aura badges auto --tier base --output pilot.json
# Review pilot.json carefully; approve its own fingerprint:
gh-aura badges auto apply --review pilot.json --confirm FINGERPRINT
gh-aura badges auto status

# First check whether GitHub has actually awarded the base achievements.
# Then plan the next checkpoint from observed workspace history:
gh-aura badges auto next --goal max --output next.json
# Read and separately approve the new plan:
gh-aura badges auto apply --review next.json --confirm FINGERPRINT
```

Repeat `next --goal max` and individually approved `apply` until the workspace records the maximum reported 1,024 PR event threshold. The tool never claims Gold was awarded by GitHub. It progresses 2 → 16 → 128 → 1,024 and refuses sequence gaps, unreadable histories, unexpected files or pending exercise branches. Each batch is capped at 16 PRs.

## Hardened event execution

- Each PR merge checks **zero submitted reviews** before merging and supplies the exact SHA of the generated head commit as a race-condition guard.
- The runner enforces at least **1.1 seconds between content-generating write requests** in one process. GitHub also documents general account-wide secondary limits (~80 content writes/minute and ~500/hour) and may restrict bursts more severely. Avoid continuous high-volume batches; no failed write is automatically retried.
- Quickdraw reports whether the API-confirmed opening and closing times satisfy the five-minute candidate window. Read-only status samples PR review and merger identity for a YOLO event candidate.
- Only one owned, marker-identified private workspace is used; other existing repositories, public projects and third-party accounts are never modified. No forced pushes or deletions.

**Actual GitHub achievement award validation remains pending.** The connection used to maintain this project cannot create the required disposable private test account or inspect private award state. CI tests simulated GitHub API interactions and read-only integration, not actual badge awards.

[Achievement rules](https://github.com/ibbuilds/gh-aura/blob/main/docs/ACHIEVEMENTS.md) · [Detailed CLI guide](https://github.com/ibbuilds/gh-aura/blob/main/docs/BADGE_RUN.md) · [Release-readiness checklist](https://github.com/ibbuilds/gh-aura/blob/main/docs/RELEASE_READINESS.md)
