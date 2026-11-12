# GH Aura v1.10.0

**Full achievement eligibility matrix, tier-aware planning and read-only event status.** GH Aura remains a local, zero-runtime-dependency Node.js 22+ CLI with one reusable, marked private workspace. GitHub—not GH Aura—grants achievements.

## Install

Download `gh-aura-1.10.0.tgz` and `SHA256SUMS.txt` from the release, verify the checksum and install:

```bash
npm install --global ./gh-aura-1.10.0.tgz
gh-aura init YOUR_USERNAME
```

## 19 mapped achievement and badge entries

The source-linked catalog now distinguishes **7 active**, **2 historical**, **2 disabled/experimental**, **3 GitHub-staff internal**, and **5 plan/program/security highlights**. Only **Pull Shark, YOLO, Quickdraw** have controllable event types in a single owned private workspace. The rest are excluded from automation with explicit reasons.

## Offline tier-aware plans

```bash
gh-aura badges auto --tier base --output base.json
gh-aura badges auto --tier bronze --output bronze.json
gh-aura badges auto --tier silver --start 16 --output silver-next.json
gh-aura badges auto --tier gold --start 128 --output gold-next.json
```

Reported Pull Shark tier targets: 2, 16, 128 and 1,024 merged PRs. Plans are **limited to sixteen exercises per invocation**; `--start` is the workspace sequence index, not an account-wide award count. Each plan includes explicit exclusions, source confidence, request bound, next sequence and reviewed SHA-256 fingerprint.

```bash
# Only after reading and approving the exact JSON:
gh-aura badges auto apply --review bronze.json --confirm FINGERPRINT

# Read-only: observe merged synthetic PRs and closed QA issues in the same repo:
gh-aura badges auto status
```

The status command checks up to twelve pages each of PRs/issues in the authenticated, owned, marked private workspace and returns **awards-unverified**. It never scrapes GitHub profile pages or invents an achievements API. Repeating a plan skips already merged exercises; incomplete historical issue checks stop before generating another Quickdraw issue.

## Security, compatibility and verification

The new v2 review format binds catalog metadata and plans to the approval fingerprint; previous v1 plans remain supported after validation. No other existing repository is modified, no additional repositories are created when the workspace exists, and no force-push or automatic deletion is performed. Generated exercise PRs/issues are explicitly marked synthetic.

Remote writes remain tested through isolated mock transports and local Git tests. The GitHub Actions matrix covers Node 22/24 on Linux/macOS/Windows, package smoke and live strictly **read-only** GitHub integration. Real GitHub private-write and earned-badge verification require a separate authorized disposable account; **a successful merge or issue close does not guarantee an award**.

[Complete mapped catalog](https://github.com/ibbuilds/gh-aura/blob/main/docs/ACHIEVEMENTS.md) · [Runner guide](https://github.com/ibbuilds/gh-aura/blob/main/docs/BADGE_RUN.md) · [Validation gates](https://github.com/ibbuilds/gh-aura/blob/main/docs/RELEASE_READINESS.md)
