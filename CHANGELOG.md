# Changelog

## 1.11.0 — 2026-11-12

- Added `badges auto next --tier ...` to determine the next approved 1–16 PR exercise batch from the **same existing private workspace** without performing any remote writes.
- Cross-checks a complete, ownership-filtered merged PR history against a complete Git tree, rejects gaps, duplicate indices, unverified exercise files, partially scanned records and pending exercise branches; does not guess progress or create new repos.
- Recognizes locally reached reported tier thresholds without claiming GitHub granted an achievement or preparing unnecessary actions.
- Improved Quickdraw status reporting to distinguish QA issues closed within five minutes from later closures; timestamps remain observations rather than GitHub award confirmation.
- Added fail-closed regression tests and updated packaged CLI documentation. Actual award validation still requires an authorized private GitHub test account.


## 1.10.0 — 2026-11-12

- Added a source-ranked, versioned 19-entry GitHub achievement/highlight matrix: seven active, two historical, two disabled, three internal and five profile/program entries. Only Pull Shark, YOLO and Quickdraw have private-solo event candidates.
- Added explicit `badges auto --tier base|bronze|silver|gold` planning targets (reported 2/16/128/1024 Pull Shark milestones), with independent, at-most-16-PR approved batches and bounded start indices.
- Upgraded new SHA-256 review files to v2, binding the catalog version, complete attempts/exclusions and operational options while preserving verified legacy v1 plans.
- Added `badges auto status`, a strictly read-only paginated observation of merged own GH Aura PRs and closed QA issues in the marked private workspace, clearly not an award or account-wide eligibility confirmation.
- Strengthened Quickdraw replay checks beyond the first page, refusing incomplete issue histories instead of generating potentially duplicated issues.
- Added catalog, tier, plan-integrity and private status regression tests; no new repository or account mutations in CI.


## 1.9.0 — 2026-11-12

- Unified observed activity and synthetic private date planning under `gh-aura activity` (`activity plan` / `activity apply`); legacy `calendar` remains an alias.
- Added a configured, default-reusable private workspace (`workspace.repo`, default `USER/gh-aura-workspace` after `init USER`) shared by activity practice and private badge exercises.
- Generated workspaces have an explicit marker; existing unmarked, forked, public or archived repositories are refused. Reused activity histories are fetched, revision-checked and extended by non-force Git push, with complete tree and file-collision checks.
- Fixed `--density 100` to select all available dates even if weekends have zero preference. Added regression coverage for workspace reuse, legacy markers, no history rewrite and collision fail-closed behavior.
- Kept badge award verification and workspace deletion outside automatic actions: GitHub alone decides graph/badge eligibility, and deleting a shared repo could remove useful history. Remote-write behavior still needs a controlled real-account test.


## 1.8.1 — 2026-11-12

- Verify synthetic calendar author-email ownership against the authenticated account's ID-based noreply address or GitHub's verified email API before any remote write. Denied/missing email proof and unknown account creation dates fail closed.
- Synchronize release and security documentation, separate genuine portfolio evidence from optional synthetic sandbox activity, and track external readiness gates.
- Add regression tests for author-email spoofing, email-read permissions and incomplete account metadata. Guard cleanup of three already-merged branches with fixed SHA checks after a successful CI gate.


## 1.8.0 — 2026-11-12

- Added `badges auto` / `badge-run` plan/apply workflow: opt-in, fingerprint-bound private owned sandbox with bounded PR merges and a QA issue, excluding third-party-dependent and paid achievements. GitHub alone controls badges.


- Added opt-in Calendar Studio: deterministic synthetic practice blueprint, UTC date ranges, percentage density, year-to-year growth, weekend preferences, observed-history gap preservation and reproducible seeds.
- Added explicit, fingerprint-bound `calendar apply` to create a NEW private owned repository and upload generated practice commits in one Git push; existing repository history is never rewritten.


## 1.7.1 — 2026-11-12

- Streamlined the root README and command reference to prioritize four direct commands, reviewed publishing, and clear limitations.
- Replaced an outdated roadmap with a compact, current product status; simplified the architecture guide.
- Removed the superseded popular-project-contributor research dataset and collector from the current tree; earlier Git history retains the original research.
- Reduced the published tarball to runtime code and essential top-level documentation; source repository research and detailed docs are still available on GitHub.
- Strengthened packed-file scope and local documentation-link regression checks.
- Cleaned up obsolete feature/research/release branches with an explicitly guarded one-time maintenance operation.


## 1.7.0 — 2026-11-12

- Added short aliases `activity`, `badges`, `readme`, and `pins`, retaining original commands and read-only/review-only boundaries.
- Replaced the primary editorial reference with a dated 200-person ordinary-visibility professional profile study across 35 company orgs; the historical 100-person sample and separate 16 employer-sourced examples remain documented. No biographies are copied or fetched at runtime.

## 1.6.0 — 2026-11-11

- Added `story list/set/remove` for command-driven, local-only project contribution narratives with `--dry-run`, validation and no API cost.

- Added opt-in `--checks` after `--deep N` to retrieve the latest public GitHub Actions run and release for selected repos. Extra API usage is explicit, source-linked and never treated as proof of code correctness.

- Added `work preview/apply` for a narrowly scoped, user-authored Markdown PR. It requires full diff review, exact revision approval and a scoped token; PRs are never merged automatically.


- Added offline `contributions --local PATH [--emails-file FILE]` for bounded Git author identity attribution without printing emails or making GitHub requests. Preserves original timestamps and never modifies history.

## 1.5.1 — 2026-11-11

- Added `contributions --plan` with conditional, future-only task ideas for actual owned repositories; zero extra network requests and no calendar or commit scheduling.

## 1.5.0 — 2026-11-11

- Added optional `audit --job FILE` for a fully local, bounded, explainable job-posting term map against real selected project evidence.
- Clearly separate observed repository metadata, user-supplied project stories and unknown qualifications; no external job text upload or paid AI.


- Added `profile --language en|es` for localized deterministic README headings and project-story labels without external translation or API calls.
- Kept the Spanish/English language choice independent from profile visual intensity and publishing approval.


## 1.4.0 — 2026-11-11

- Added a role-aware first-minute **hiring-manager review** to the existing `audit` command, with `--goal` override.
- Separated observable profile/project evidence, actionable presentation gaps and technical unknowns. No employability or interview probability score.
- Linked selected portfolio projects, detected README onboarding hints, user-controlled contact routes and target-role metadata matches without claiming technical quality or personal authorship.
- Kept the existing request budget, caching and explicit review/publish boundaries; the new analysis makes no additional API calls.
- Added deterministic tests and a hiring-focused product guide identifying future deep project-evidence and job-description work.


## 1.3.0 — 2026-11-11

- Replaced the primary open-source *project contributor* reference with an explicitly sourced study of **individual engineer profiles**.
- Recorded 100 company-associated engineering accounts from 21 organizations using public membership and self-described company/role signals, labeled **employment unverified**.
- Added a distinct set of 16 GitHub profiles associated with employer-controlled engineering author pages; links and review dates are retained, and employment claims may be historical.
- Added a zero-network `references` CLI command with employer filtering and JSON output.
- Added `editorial.targetCompany` as an aspirational target, never a claimed existing employer.
- Updated editorial brief and writing instructions to use only structural lessons, real project ownership and verifiable work; no biography copying or hiring-outcome claims.
- Kept full source data and research collectors outside the installable runtime package; source hashes and cross-platform regression checks preserve provenance.
- Preserved user-directed review/publish and zero-runtime-dependency design.


## 1.2.0 — 2026-11-11

- Split parsing, local work, public reads and publishing into lazily loaded command handlers.
- Added request/stream-byte budgets, `--budget` and token-free `--stats` measurements.
- Removed unused existing-README reads during plain draft generation; added a reproducible 4→2→0 request fixture.
- Added `--visual 0..100`, editorial preferences, compact briefs, writing prompts and fully local draft checks.
- Recorded structural observations from 100 public contributor accounts across 12 projects, with provenance and explicit sampling limits.
- Added cohort-integrity, budget, editorial and actual CLI live-read tests; normalized repository line endings across platforms.
- Kept badge awarding, professional identity and historical activity outside presentation automation.

## 1.1.0 — 2026-11-11

- Added bounded local public-read caching, ETag revalidation and `--fresh`; preview/apply always bypass cache.
- Skipped unused profile reads for showcase, achievements and contribution commands.
- Added explicit `apply --pr` with no automatic merges and safe matching-PR reuse.
- Added `profile --keep` to preserve user-owned Markdown outside one managed region.
- Added opt-in, bounded release/commit/merged-PR timeline evidence and dated achievement-source review.
- Added cache/privacy, PR-publication and preservation regressions plus live cache verification.
- Removed CI artifact uploads and guarded workflows to public repositories using standard runners.
- Documented free operation, token permissions, rate limits and resolution of the original planning issues.

## 1.0.0 — 2026-11-11

- Simplified the primary flow: save a username once, audit, draft, preview and explicitly apply a local review file.
- Added annual contribution reports, visibility diagnostics and bounded repository milestones.
- Added configurable achievement opportunities with public PR/star evidence, self-reported status and paid/historical distinctions.
- Fixed pagination, exact featured selections, private-data boundaries, safe Markdown links and executable symlink handling.
- Bound publishing to the exact draft, target branch and current README revision; rejected stale or incomplete reviews and removed automatic write retries.
- Added strict command-specific flags, cross-platform unit/E2E tests, installed-package checks and live read-only integration.
- Kept external AI optional through JSON briefs; no runtime dependencies, UI or autonomous profile changes.

## 0.3.0 — 2026-11-11

Added local config commands, editorial briefs and digest-approved README publishing.

## 0.2.0 — 2026-11-11

Added candidate README inspection and terminal diffs.

## 0.1.0 — 2026-11-11

Initial audit, showcase, achievement guide and three README styles.

