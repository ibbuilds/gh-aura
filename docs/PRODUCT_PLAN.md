# GH Aura — Definitive product plan

**Status:** Product plan, not a promise that the future commands described here are implemented.  
**Updated:** 2026-11-11  
**Product:** Free, local-first, user-directed GitHub profile CLI. No web dashboard, daemon, mandatory AI, paid API or autonomous activity.

## 1. One goal

**Help a developer make their real GitHub work discoverable, understandable and professionally presentable.** A visitor should identify the person's focus, strongest proof of work, contribution history and relevant external links within about one minute.

GH Aura has **four optional modules**. The user invokes the exact command they want, previews the consequences and explicitly approves every remote modification:

1. **Activity:** analyze actual contribution history across selected years, recover eligible missing attribution, expose genuine private activity with the user's settings, and suggest purposeful new work.
2. **Achievements:** map earnable GitHub achievements/badges, source and classify eligibility, prepare supported steps and verify visible outcomes without pretending GH Aura awards them.
3. **Profile:** produce a polished README and profile presentation in minimal, regular or flashy styles with granular toggles and an optional external editor.
4. **Showcase:** inspect repository evidence, recommend a diversified set of up to six role-relevant pins, and provide GitHub's manual pinning instructions.

The modules remain independent: someone may run only achievements, only profile, only activity or only showcase. There is no mandatory "optimize everything" command or hidden background activity.

## 2. Platform reality and boundaries

| User intent | What GitHub supports | GH Aura behavior |
| --- | --- | --- |
| Show private contribution activity | Opt-in anonymized contribution counts, subject to GitHub attribution/eligibility | Diagnose and guide settings; do not reveal private content |
| Analyze any year or real date span | GraphQL historical contribution collections, subject to account age/access and API constraints | Scope read queries to requested years, report observed/unknown separately |
| Recover old actual commits not counted | Confirmed author emails, qualifying branches, repository context and visibility settings can matter | Identify genuine omissions and suggest supported corrections |
| Artificially fill a past heatmap | No supported "paint contributions" API; commit metadata can differ from actual work dates | **Do not fabricate or backdate work, mass-produce dummy commits or rewrite history to simulate experience** |
| Obtain profile achievements | GitHub awards them based on eligible activity; individual eligibility is subject to change | Guide or perform consented genuine tasks when supported; confirm badge on GitHub |
| Use private repositories for achievements | GitHub says private activity may count with appropriate visibility settings; award-specific conditions are not universally guaranteed | Treat private compatibility as verified/uncertain per achievement, never assume all badges work in private |
| Pin repositories | GitHub supports up to six public repo/gist pins in its profile UI | Rank and recommend; do not promise an undocumented public auto-pin mutation |
| Revise profile README | GitHub Contents API with scoped permissions | Prepare diff and explicit reviewed apply or unmerged PR |

**Important distinction:** A *private repository* is not a *private personal profile*. A public personal profile may show anonymized eligible private contribution counts when enabled; making the entire personal profile private hides its contribution graph and achievements from other viewers. This product targets a public, recruiter-visible personal profile with user-controlled repository privacy.

**Do not conflate distinct kinds of badges:** collectible Achievements, program memberships, paid status and historical one-time awards. Do not promise all achievements, external stars, accepted discussion answers or program admissions. Avoid sockpuppet accounts, self-starring networks, artificial PR chains and meaningless issues to game metrics.

GitHub's **author date** can differ from the **commit date**. A heatmap is not proof of professional experience. Preserve real provenance and clearly label any historical gaps or unavailable private data.

## 3. Human-friendly CLI contract

The current commands are kept compatible. Future subcommands are added only where they meaningfully simplify a user-driven task.

### Already implemented in v1.4

```bash
gh-aura init YOUR_USERNAME
gh-aura audit --goal "backend engineer" --inspect 3
gh-aura contributions --all
gh-aura achievements
gh-aura profile --visual 20 --output draft.md
gh-aura showcase --goal "backend engineer"
gh-aura brief --prompt --output writer.txt
gh-aura check --file draft.md
gh-aura preview --file draft.md --save review.json
gh-aura apply --review review.json --pr
```

Only explicit, reviewed `apply` writes the profile README remotely. A separately authorized `work apply` will support opening an unmerged documentation PR. Everything else is read-only or produces a local file.

### Proposed, not yet implemented

```bash
# Inspect and recover REAL history in a requested range
gh-aura contributions audit --from 2020 --to 2026 --private
gh-aura contributions recover --from 2020 --to 2026
gh-aura contributions plan --from 2026-11-11 --to 2027-02-11

# Browse genuine opportunities, then explicitly prepare supported tasks
gh-aura achievements plan --scope free --private auto
gh-aura achievements inspect pull-shark
gh-aura achievements prepare pull-shark --repo USER/REAL_PROJECT

# Rework only one selected module
gh-aura profile --style minimal --output draft.md
gh-aura profile --visual 80 --output draft.md
gh-aura showcase --goal "platform engineer" --inspect 3
```

**No command may silently write to a repo, change Git history, modify profile settings or trigger scheduled commits.** Use `--dry-run` or a separate preview before an explicit approved write, with the destination, proposed diff, permissions and rollback path displayed.

## 4. Module A — Activity

**Inputs:** account, one year/all years/custom interval, visibility choices, optional authenticated read permission to selected private repos.

**Read-only analysis:**
- Year-by-year and day-by-day GitHub-visible contributions, with bounded GraphQL requests.
- Missing attribution diagnostic: verified author email vs email used on actual commits; qualifying default/`gh-pages` branch; forks/upstream PRs; privacy visibility; organization/enterprise caveats.
- Compare real existing commits and authored PRs to what GitHub reports, where authorized. Do not equate a zero in a partial/private response with inactivity.
- Explain what can legitimately be recovered and which steps need the user to change GitHub settings.

**Optional action plan:** For requested *future* dates, suggest work backed by real repository needs: tests, docs, bug fixes, releases, reviews and meaningful project milestones. Work is performed only when the user elects to do it. Private work is never automatically publicized.

**Never:** create empty or filler commits, fabricate past authorship, adjust timestamps to fill specific calendar squares, force-push/rebase historical work to create an invented timeline, or create extra identities to impersonate collaboration.

**Done when:** every data point is dated, sourced and classified as observed, inferred, unknown or user-confirmed. Reruns are stable; changes to repositories or privacy settings require informed user action. No private source/code enters the public output.

## 5. Module B — Achievements

Build and maintain a **versioned achievement capability registry**, not a list of unverified internet recipes:

```text
id | name | kind | currently_earnable | cost | private_eligibility
official_source | community_source | last_checked | trigger_confidence
required_action | who_controls_result | GH_Aura_action | verify_on_GitHub
```

**Initial catalog groups:**
- **Potentially attainable, subject to current rules:** Pull Shark (merged PRs), Pair Extraordinaire (real co-authorship), Galaxy Brain (accepted Discussions answers), Starstruck (independent stars), Quickdraw (fast issue/PR closure), YOLO (unreviewed PR merge).
- **External/paid/program-specific:** Public Sponsor, Pro, Developer Program, Campus Expert, security awards/programs; treat each as a different badge kind.
- **Historical/unavailable:** Arctic Code Vault Contributor, Mars 2020 Helicopter Contributor.
- **Experimental/unverified:** never counted as guaranteed attainable until GitHub's behavior supports the claim.

For each entry, classify the GH Aura operation:
- **Read-only:** source links, user eligibility hints, verified visible badge status where supported, suggested steps.
- **Prepared action:** a local or remote draft of meaningful code/issue/PR work requiring user review.
- **User/external action:** review acceptance, answers accepted by maintainers, genuine independent stars, external program eligibility/payment.
- **Not supported:** retired awards, undocumented awarding, synthetic engagement or unsafe bypass of normal reviews.

Private repos are an **optional work surface for substantive tasks**, not a badge-farming sandbox. GH Aura never guarantees that an achievement will count when activity is private.

**Done when:** all displayed badge requirements have source/verification dates; the report distinguishes earned (GitHub-observed), user-reported, eligible, uncertain, historical and paid statuses. No unsupported claims about award thresholds or private-repo eligibility. All writes are optional and permission-scoped.

## 6. Module C — Profile

Three editorial strategies with per-section switches and explicit customization:

| Style | Intent | Default design |
| --- | --- | --- |
| `minimal` (or 0–34) | Reserved engineering profile | Short credible headline, concise context, 2–3 best projects, contact |
| `regular` (35–69) | Stronger portfolio presentation | About, selected work with explanations, confirmed stack, relevant links |
| `flashy` (70–100) | Visual showcase | Optional graphics, shields, widgets and additional sections; accessibility and loading checked |

An optional `--visual 0..100` controls *presentation only*, never activity counts, experience level, achievements, seniority or credibility. User preferences and disabled sections always override presets.

**Content policy:** Drafts draw first from the user's observable work and explicitly confirmed claims. External AI is optional and receives a bounded JSON brief, not GitHub write credentials. Industry references provide structural ideas, never copied biographies, unverifiable employers or prestige claims. Local `check` detects obvious repetition/unsupported-looking claims; every final draft is user-reviewed.

**Apply:** Preview exact complete diff, then explicit approval and optionally an unmerged PR. Do not overwrite custom README sections without consent. Re-run safely without commits when nothing changed.

**Done when:** drafts are concise, distinct across styles, useful for an engineering role and readable on GitHub mobile/desktop; rendering tests, link checks, repeatability and safe-apply tests pass.

## 7. Module D — Showcase

**Optional by design.** When requested, select up to six public repositories or gists (within GitHub's pin limits). Do not rank solely by stars, commit volume or recent modification.

**Evidence priority:** declared target role, substantial personal contribution, runnable example/demo, clear README, tests/CI/releases where inspectable, maintenance, variety of skills; popularity is a weak supplemental signal. The current v1.4 ranking is **metadata-based**; deep technical evidence inspection is **planned**, not delivered.

Allow users to exclude/force-include/reorder candidates, identify why a repo is recommended, and only inspect 2–3 selected projects deeply by default to control API cost. Pins are selected in GitHub's documented UI until a supported mutation exists; GH Aura can generate a manual selection guide.

**Done when:** recommendations are role-specific, explainable, respect explicit picks, distinguish missing from uninspected data, and never claim a source-quality or hiring score from metadata.

## 8. Engineering and cost rules

- Node.js ≥22, ES modules, **zero runtime dependencies** unless a specific correctness/security requirement justifies one.
- Official REST/GraphQL endpoints. Reuse pagination, conditional ETags and bounded five-minute **public-only** cache.
- Explicit per-command API request and response-byte budgets. Fetch user/profile inventory once, then only selected repo files. Never crawl 100 reference profiles during a normal command.
- Public profile audit works without paid services; optional free GitHub token for higher API allowances. No token stored in config, no secrets in logs or external AI context.
- Fine-grained read/write permissions scoped to explicitly chosen repositories; never request global private-org access by default.
- Every mutation is a separate user action with a complete diff, authorization, conflict check, no automatic retries of uncertain writes, and a rollback path.
- Tests: offline fixtures for sparse/new/private-heavy accounts; real read-only GitHub integration; Node 22/24 on Linux/macOS/Windows; failure injection for rate limits, conflicts and data leakage; performance budgets; package smoke tests.
- Research corpus versioned outside runtime package. No telemetry, mandatory account registration, browser UI or background scheduler.

## 9. Delivery order and gates

| Stage | Work | Release gate |
| --- | --- | --- |
| **Current v1.4** | CLI foundation, README styles, metadata audit, contribution annual counts, badge guide, showcase suggestions, reviewed publish | Already shipped; keep backward compatibility |
| **A1 — Activity Recovery** | Per-year/range audit, verified attribution diagnostics, private contribution visibility guide, future authentic work plan | No synthetic events, no history edits, exact period reports and privacy tests |
| **B1 — Achievement Capability Matrix** | Complete dated catalog, per-badge private support confidence, eligibility/verification and action planner | Every badge sourced; no false earned status or guaranteed awarding |
| **B2 — Guided Genuine Actions** | Optional repo-specific approved changes/tasks where current GitHub API behavior supports them | Explicit consent, idempotency, proof of meaningful operation, safe rollback |
| **C1 — Profile Studio** | Improved style outputs and independent toggles, optional editor integration, publish previews | No invented employment/skills, no unreviewed overwrites |
| **D1 — Showcase Evidence** | 2–3 selected repos inspected more deeply, relevance and personal contribution evidence | Source-backed choices, bounded requests, no metadata-as-quality claims |
| **R — Hardening** | Documentation, privacy, cross-platform tests, package and GitHub Release | All checks green; source and API quota budgets documented |

**Priority:** A1 → B1 → B2 → C1 → D1 → R. Each stage may release independently after its gates; don't wait for every feature to ship useful improvements. The core must remain minimal.

## Incremental implementation status

- **Current v1.5.1:** Historical GraphQL windows, authenticity-recovery guidance, bounded public repo inspection, achievement capability registry and read-only task preparation, configurable profile strategies and privacy-conscious job matching are implemented.
- **Next feature in review:** A narrowly scoped, user-reviewed Markdown documentation PR workflow for real work; GitHub awards are never guaranteed and the user supplies the substantive change.
- **Remaining verification:** independent recruiter/engineer usability study, actual test/CI status evidence, more nuanced job-domain matching, and review of GitHub private attribution boundary cases.
- Previously proposed nested commands are **concept sketches**. The actual shipped CLI uses concise flags such as `contributions --recover`, `achievements --plan` and `achievements --prepare`. Use `gh-aura COMMAND --help` for authoritative syntax.

### Project narrative UX

`story set/list/remove` manages user-supplied, source-linked descriptions of individual work entirely locally. The CLI never upgrades such claims to verified engineering achievements; `profile` and `audit --job` can reuse the configured stories. No AI/paid provider or GitHub write is involved until a separately approved profile review.

## Implemented feature status — v1.6.0

- Authentic local Git author analysis: `contributions --local PATH [--emails-file FILE]` performs zero network requests and prints no sensitive author identity values. No authorship changes or false eligibility claims.
- Explicit reviewed documentation PRs: `work preview` and `work apply` authorize exactly one root README/docs Markdown change. A scoped token is required only for the approved PR creation; no automatic merge or GitHub award.
- Optional observed GitHub Actions status and published release evidence: `audit --deep 2 --checks`, with bounded, visibility-verified API requests. A passing historic run is not a technical certification.
- Local project-story management: `story set/list/remove` replaces manual JSON editing for user-supplied problem, contribution and evidence notes.
- **Human 60-second evaluation remains unperformed**: [protocol](HUMAN_VALIDATION.md) is documented, but reviewers and profile-owner consent are necessary. Issue #21 must remain open pending actual evaluation.

## Reference cohort update (2026-11-12)

A one-time GitHub API research workflow examined 1,040 accounts and selected 200 public engineering profiles across 35 company organizations, excluding accounts with more than 2,000 visible followers to reduce celebrity bias. The three signals remain public organization membership, self-listed employer and self-described role. This is **not** certified employment, technical evaluation or measured hiring success. The runtime uses compact aggregate structure, not the full research corpus or a live people crawler. See [research/ORDINARY_STUDY.md](../research/ORDINARY_STUDY.md).

## Tracked implementation work

- [#22 — A1: real historical contributions and private visibility](https://github.com/ibbuilds/gh-aura/issues/22)
- [#23 — B1: source-backed achievement/eligibility registry](https://github.com/ibbuilds/gh-aura/issues/23)
- [#24 — B2: user-approved genuine achievement operations](https://github.com/ibbuilds/gh-aura/issues/24)
- [#25 — C1: deeper configurable profile strategies](https://github.com/ibbuilds/gh-aura/issues/25)
- [#19 — D1: meaningful evidence from chosen repos](https://github.com/ibbuilds/gh-aura/issues/19)
- [#20 — role-specific work evidence and user-confirmed contributions](https://github.com/ibbuilds/gh-aura/issues/20)
- [#21 — first-minute reviewer validation](https://github.com/ibbuilds/gh-aura/issues/21)

The roadmap is authoritative for future direction. Issues are implementation units, **not** proof that a stage is already delivered.

## 10. Definition of success

- A new user can install GH Aura, choose a module and get a usable output with **one direct command** after `init`.
- Each suggested improvement is reproducible, sourced and clearly explains what is unknown.
- The tool maximizes **supported, authentic** profile improvements without paid infrastructure, private data leaks or fabricated history.
- Users can explicitly opt into meaningful new work and privately generated contributions that are genuinely theirs, while controlling privacy.
- Every repo/profile write is preceded by review and consent.
- No badge, ranking or heatmap promises employment; profile value comes from verifiable work.

## Official platform references

- [Profile contribution counting and author/commit timestamps](https://docs.github.com/en/account-and-profile/reference/profile-contributions-reference)
- [Private contribution and achievement visibility](https://docs.github.com/en/account-and-profile/how-tos/contribution-settings/manage-visibility-settings-for-private-contributions-and-achievements)
- [How GitHub achievements are awarded](https://docs.github.com/en/account-and-profile/reference/profile-reference)
- [Troubleshoot real missing contributions](https://docs.github.com/en/account-and-profile/how-tos/contribution-settings/troubleshooting-missing-contributions)
- [Pinned items and six-item limit](https://docs.github.com/en/account-and-profile/how-tos/profile-customization/pinning-items-to-your-profile)
