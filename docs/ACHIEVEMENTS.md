# Achievement capability registry

GH Aura keeps a sourced, dated **capability map** of GitHub profile achievements and other badges. GitHub awards them; GH Aura cannot grant them or guarantee private-repository eligibility.

## Commands

```bash
# All known categories, fully offline without a configured account
gh-aura achievements

# No-cost, potentially attainable collectible achievements
gh-aura achievements --plan --scope free

# One specific badge, including its limitations
gh-aura achievements --badge pull-shark --plan

# Show private-repository-relevant possibilities (not guarantees)
gh-aura achievements --scope free --private --plan --json
```

If a GitHub account is configured, the read-only report can add selected public merged-PR/star evidence. This evidence is **not** a complete badge-eligibility count or proof that GitHub awarded a badge. With no account, the guide uses no API calls.

## Genuine repository-specific task preparation

`gh-aura achievements --prepare pull-shark --repo OWNER/PROJECT` returns a local work plan, optionally informed by existing public issues. It never opens a PR or awards a badge. Use `--private` to prepare without reading a private repository. Only safe tasks (Pull Shark, Pair Extraordinaire, Galaxy Brain, Starstruck) are supported; others are refused. See [Preparation details](ACHIEVEMENT_ACTIONS.md).

## Classes

| Class | Meaning | Examples |
| --- | --- | --- |
| Collectible Achievements | GitHub may award a badge after eligible events | Pull Shark, Pair Extraordinaire, Galaxy Brain, Starstruck, Quickdraw, YOLO, Public Sponsor |
| Paid | A paid plan or voluntary sponsorship may be required | GitHub Pro, Public Sponsor |
| Program | Separate GitHub membership/acceptance criteria | Developer Program, Campus Expert, security programs |
| Historical | Past limited event; new users cannot newly earn it | Arctic Code Vault, Mars 2020 |
| Experimental/internal | Unverified, disabled, staff-only or limited-public eligibility | Heart On Your Sleeve, Open Sourcerer, internal staff badges |

Some entries have overlapping concepts (Public Sponsor is a collectible achievement requiring voluntary payment). GH Aura includes that distinction in each record.

## Optional private sandbox executor

`gh-aura badges auto --repo OWNER/aura-achievements --pulls 2 --output badges.json` creates a fully offline reviewed plan. `gh-aura badges auto apply --review badges.json --confirm FINGERPRINT` can create an **owned, marked private repository** and run bounded generated PR/issue exercises. These are attempts at GitHub activity, not guaranteed awards. Pair Extraordinaire, Galaxy Brain and Starstruck remain excluded because they depend on others or external controls. See [badge sandbox automation](BADGE_RUN.md).

## Private repository compatibility

GitHub documents that achievements can use qualifying private activity when the account chooses to show eligible private contributions. It does **not** publish a complete authoritative matrix for every badge and every trigger. Thus the registry uses:
- `possible-unverified-per-award` — some relevant events can occur in private repos, but the award is not guaranteed.
- `unknown-per-award` — GitHub has not documented exact private trigger compatibility here.
- `requires-public-discovery` — other people must see/star a public repo; private stars are not a credible substitute.
- `not-applicable` — paid, program, historical or otherwise not repository-specific.

`achievements --prepare` is read-only. The separate reviewed `badges auto` runner can create and merge **generated exercise PRs** in an owned, marked private sandbox and close a QA issue. It does not create puppet collaborators, self-star repositories, spam public discussions or bypass existing branch protections. Private and self-owned events may not count toward awards.

## Evidence levels

`sourceReviewedAt` records when documentation was inspected. `triggerConfidence` distinguishes partial official descriptions from community-reported details; numerical tier thresholds are **community reported**, never represented as guaranteed. `status` distinguishes self-reported earned, unavailable, external program/paid, or an unverified opportunity. No official comprehensive earned-achievements API is assumed.

If an achievement is not displayed, check **GitHub → Your profile → Achievements** and whether achievements are visible under your profile settings. Only GitHub can confirm actual award status.

## Sources

- [GitHub profile reference](https://docs.github.com/en/account-and-profile/reference/profile-reference)
- [Introducing Achievements](https://github.blog/news-insights/product-news/introducing-achievements-recognizing-the-many-stages-of-a-developers-coding-journey/)
- [Private contribution visibility](https://docs.github.com/en/account-and-profile/how-tos/contribution-settings/manage-visibility-settings-for-private-contributions-and-achievements)
- [Community-reported current/historical achievements](https://github.com/christianalberto/github-profile-achievements)
