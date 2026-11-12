# GH Aura v1.13.0

**Faster, rate-aware progress toward GitHub Achievements without sacrificing repo integrity.**

GH Aura is a local-first CLI for Node.js 22+, zero runtime dependencies, one reusable owned private workspace, and explicit approval of every write batch.

## Install

Download `gh-aura-1.13.0.tgz` and `SHA256SUMS.txt` from the [GitHub Release](https://github.com/ibbuilds/gh-aura/releases/latest), verify the checksum, and install:

```bash
npm install --global ./gh-aura-1.13.0.tgz
gh-aura init YOUR_USERNAME
```

## Efficiency improvements

The PR exercise runner uses the GitHub squash-merge SHA it just received as the verified parent for the **next** exercise branch. Compared with the previous implementation, an uninterrupted 16-PR batch avoids **15 extra base-branch GET requests**. Previously redundant fixed sleeps after GitHub repository/branch creation were removed; a documented **minimum 1-second pause between mutative requests** remains.

A new **atomic, locally persisted rolling hourly write budget** caps GH Aura to 480 mutative requests per authenticated GitHub account in 60 minutes on the same computer, leaving limited headroom below GitHub's general ~500 content-generating requests/hour secondary limit. The ledger uses a hashed account key and records only timestamps, not credentials. It fails closed on concurrent reservation, corrupt data or clock inconsistency; an uncertain write still uses a reservation. **Quickdraw pre-reserves both issue-opening and issue-closing writes as one atomic pair** to avoid hitting the budget between them. The apply output exposes remaining locally reserved capacity.

This is not a rate-limit bypass: GitHub can impose tighter secondary limits, and external clients share the effective account budget. The 1,024-PR Gold target still needs genuine eligible events, not faster local arithmetic. Four REST mutations per generated PR imply about **4,096 writes** for 1,024 PRs (theoretical best case ~8.2 hours at GitHub's general 500/hour ceiling, with no guarantee those PRs earn awards). The CLI provides no unattended mass-execution loop.

## Workflow

```bash
gh-aura badges auto --tier base --output pilot.json
# Inspect and separately approve the pilot's SHA-256 fingerprint:
gh-aura badges auto apply --review pilot.json --confirm FINGERPRINT
gh-aura badges auto status

# Only after checking the actual badge in your GitHub profile:
gh-aura badges auto next --goal max --output next.json
gh-aura badges auto apply --review next.json --confirm NEXT_FINGERPRINT
```

Progress remains staged at 2 / 16 / 128 / 1,024 PR event milestones, with 16 PRs maximum per approved batch; YOLO and Quickdraw have single-level event candidates. All writes go to the same marked, user-owned private workspace. No repos are force-updated or deleted, and no unrelated/third-party repos are touched.

## Verification and remaining limit

CI covers Node.js 22/24 on Linux, macOS and Windows, local Git/mock REST tests, bundled package smoke and live strictly read-only public GitHub integration. No real GitHub private-account write or badge award was verified by this patch. GitHub's award decisions require a controlled, authorized pilot.

[Runner details](https://github.com/ibbuilds/gh-aura/blob/main/docs/BADGE_RUN.md) · [Achievement matrix](https://github.com/ibbuilds/gh-aura/blob/main/docs/ACHIEVEMENTS.md) · [External validation](https://github.com/ibbuilds/gh-aura/blob/main/docs/RELEASE_READINESS.md)
