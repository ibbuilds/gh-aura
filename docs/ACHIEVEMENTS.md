# GitHub Achievements — complete eligibility matrix

**Reviewed 2026-11-12 · Registry version `2026-11-12.v1`.** GitHub has not published a complete permanent list of exact achievement rules or an official award-grant API. GH Aura maintains source-attributed rules, reports uncertainty and never treats an API event as a confirmed badge.

## Seven currently obtainable achievements

| Achievement | Reported trigger | Private, one-account workspace | Decision |
| --- | --- | --- | --- |
| Pull Shark | Merged own pull requests; reported tiers 2 / 16 / 128 / 1,024 | **Candidate**: an owned private repo can merge its exercise PRs; award still controlled by GitHub | Attempt |
| YOLO | Merge your own PR without a formal review | **Candidate**: permitted only when repository rules allow | Attempt |
| Quickdraw | Close an issue/PR within 5 minutes | **Candidate**: close a labeled QA issue promptly | Attempt |
| Pair Extraordinaire | Coauthored commits in merged PRs; reported tiers 1 / 10 / 24 / 48 | Requires a **real consenting second person** | Exclude |
| Galaxy Brain | Accepted answers in repository Discussions; reported tiers 2 / 8 / 16 / 32 | Requires **someone else** to accept an authentic answer | Exclude |
| Starstruck | Independent stars on a public repo; reported tiers 16 / 128 / 512 / 4,096 | Requires **voluntary public audience activity** | Exclude |
| Public Sponsor | Voluntary GitHub Sponsors relationship | Requires **payment**, not a private exercise | Exclude |

The threshold values above come from GitHub profile achievement fragments and community documentation. GitHub does not promise an award for self-created/private events. Private contribution and achievement visibility is a manual GitHub account setting, not changed by GH Aura.

## Other entries — mapped, never automatically attempted

| Category | Entries | Why excluded |
| --- | --- | --- |
| Historical (2) | Arctic Code Vault Contributor; Mars 2020 Helicopter Contributor | Their qualifying historical events have passed |
| Disabled/experimental (2) | Heart On Your Sleeve; Open Sourcerer | No reliable current public award path |
| GitHub staff-only (3) | Proxima Pioneer; Proxima Staffshipper; Proxima Staffuser | Internal GitHub activities |
| Profile highlights/program badges (5) | GitHub Pro; Developer Program Member; Campus Expert; Security Bug Bounty Hunter; Security advisory credit | Plans, memberships or independent security review; not ordinary repo achievements |

The machine-readable catalog is in `src/achievement-matrix.mjs`. Its `category`, `route`, `automatable`, `sourceUrls`, `criteriaConfidence`, `tierThresholds` and `sourceReviewedAt` fields describe **what is known**. `proxima-staff` remains a legacy config alias for older profile configurations; the actual matrix records the three internal entries separately.

## Commands

```bash
gh-aura badges all --json                 # Catalog, read-only
gh-aura achievements --plan --scope free # Explain potential no-cost actions
gh-aura badges auto --tier base --output base.json
gh-aura badges auto --tier bronze --output bronze.json
gh-aura badges auto next --tier silver --output silver-next.json
gh-aura badges auto status               # Read-only workspace event observations
```

The `badges auto` plan command is offline. It only ever selects **Pull Shark, YOLO, and Quickdraw**, explicitly excludes the other sixteen entries, and binds its decisions to a SHA-256 review fingerprint. The approved `badges auto apply` can create or reuse one owned, GH Aura-marked private workspace for bounded PR/issue exercises.

**Tiers are planning targets, not achievements granted.** Bronze suggests up to sixteen exercise PRs, while silver/gold require separately approved non-overlapping batches. `--start` (0..1023) is a workspace exercise index, not a verified account-wide qualifying count; an already-earned achievement must still be checked on GitHub.

`badges auto status` reads merged exercises and closed QA issues in that exact private workspace, returning `observed-workspace-events-awards-unverified` and a manual verification link. `badges auto next --tier ...` is a separate **read-only** operation that validates that record against the full Git tree before preparing the next non-overlapping approved batch. It cannot confirm a GitHub-issued badge or account-wide tier. No HTML scraping, secondary accounts, fake coauthors, public reaction spam or sponsor payments are used.

## Sources and review boundaries

- [GitHub profile reference](https://docs.github.com/en/account-and-profile/reference/profile-reference) — official behavior, badges versus highlights
- [Private achievements visibility](https://docs.github.com/en/account-and-profile/how-tos/contribution-settings/manage-visibility-settings-for-private-contributions-and-achievements) — account setting
- [GitHub's original Achievements announcement](https://github.blog/news-insights/product-news/introducing-achievements-recognizing-the-many-stages-of-a-developers-coding-journey/) — evolving/beta eligibility
- [Observed GitHub achievement-detail fragments](https://conroy1988.github.io/Achievements/official-achievement-fragments/) — thresholds and triggers taken from public profile product UI
- [Evidence-based community catalog](https://github.com/SharmARohitt/Github-Achievement) and [independent community tracker](https://github.com/christianalberto/github-profile-achievements) — historical, experimental and internal classification

[Workflow runner guide](BADGE_RUN.md) · [Release validation](RELEASE_READINESS.md)
