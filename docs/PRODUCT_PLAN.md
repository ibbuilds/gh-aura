# GH Aura — Product plan

**Status:** Approved direction for implementation planning; no product features implemented yet.  
**Updated:** 2026-11-11  
**Product:** Open-source, local-first GitHub profile enhancer  
**North star:** Can someone understand a developer's strongest, *verifiable* technical work in 60 seconds?

## 1. Problem and positioning

A GitHub profile can underrepresent an engineer because its bio, profile README, pinned work, repository descriptions, and visible activity are poorly curated. GH Aura converts scattered existing evidence into a concise professional story, then helps users create *real* new evidence through useful projects and contributions.

**Promise:** Analyze -> Prioritize -> Draft -> Review -> Apply -> Verify.

**Audience:** Students and early-career developers; experienced engineers with inconsistent profiles; people transitioning specialties; active open-source contributors.

**Out of scope:** LinkedIn; automating job applications; fabricating work/achievements; rewriting old commits to simulate a trajectory; promising recruiters will hire someone; general-purpose source-code refactoring.

## 2. Product principles and explicit trade-offs

1. **Evidence-first:** Make claims only when grounded in the user's own projects, supplied facts, or other attributable sources. Unverifiable claims must be labeled as user-provided or require review.
2. **60-second clarity:** Optimize hierarchy and signal, not animations, badge walls, or arbitrary activity volumes.
3. **Privacy:** Public-only audit by default. Explicit opt-in for private repository metadata, generative AI, and write operations.
4. **Human review:** Show suggested edits and diffs, preserve user overrides, and provide a rollback path.
5. **Meaningful activity:** Suggest authentic work; never create empty commits, fabricated timestamps, fake stars/reactions, or throwaway repositories intended to game achievements.
6. **No scoring black box:** Explain every finding and its evidence. A readiness checklist is preferred to an unsupported "engineering quality score."
7. **Provider reality:** Distinguish changes possible by official API from recommendations requiring UI interaction. No unsupported claims of automatic profile pinning or badge granting.

## 3. Core user journey

1. Run `gh-aura audit --user <login>` (read-only, public-data mode).
2. Receive a `report.md` and machine-readable `report.json` with evidence, severity, quick wins, and unknowns.
3. Set an optional goal (role, stack, hiring audience, preferred language, level, and design style).
4. Generate a minimal profile README and a ranked shortlist of showcase repositories.
5. Review the content and diffs. Nothing is published automatically.
6. Apply approved README changes through an authorized branch/PR or copy/paste, depending on access.
7. Track genuine achievements and contributions, and periodically rerun the report for useful changes.

**Report sections:** Snapshot; first-impression checklist; missing data; repository inventory; showcase suggestions; achievable next steps; contributions visibility diagnostics; achievement opportunities; draft action plan.

## 4. Modules

### A. Profile audit (P1 / MVP)

**Inputs:** username, optional scoped authentication, optional role/stack goal.

**Checks:**
- Display name, concise bio, profile photo presence, contact URL, hireability (where visible).
- Existence and structure of public `<username>/<username>` profile README.
- Clear engineering focus and concise summary; avoid unsupported claims.
- Public repository inventory: descriptions, topics, licensing, README, live demo, recent meaningful updates, forks/archives, stars, language, and optional CI/test signals.
- Existing pinned repositories where accessible; record missing API data as `unknown` rather than `bad`.
- Basic link hygiene and whether visitors can access highlighted work.

**Outputs:** structured findings `id, severity, observed_evidence, recommendation, source_url, confidence, requires_auth`. Avoid opaque profile ratings.

**Acceptance:** Works on any public GitHub username; handles no README, no repos, API rate limits, and partial data gracefully; read-only; produces reproducible JSON and human-readable Markdown.

### B. Profile README studio (P2 / MVP)

Three editorial presets: `minimal` (default), `engineering`, and `open-source`.

Sections (as needed): headline, short positioning statement, demonstrated strengths, 2–4 projects with a one-line outcome, currently building, contact. No obligatory animated graphics, misleading technology icons, inflated experience, or vanity stats.

Features: editable draft, links checked where feasible, Markdown preview, consistency lint, generated changes shown as a diff, no inferred certifications or job titles.

**Acceptance:** Generates useful Markdown from sparse profile data without inventing skills; supports user-supplied details, style/role changes, and manual overrides; never pushes by default.

### C. Showcase/pins advisor (P3 / MVP)

Recommend up to **six** projects, **not** merely the six most starred.

Initial explainable weights (configurable):
- Role and skill relevance: **30%**
- Demonstrated technical substance: **25%**
- README, examples, demo, and usability: **20%**
- Maintenance and ownership signals: **15%**
- Public interest (stars/forks): **10%**

Normalize by available data; show unknowns; do not punish legitimate new/no-star projects by default. Down-rank obvious forks, duplicates, empty showcases, and archived work unless justified. Encourage diversity of demonstrated skills rather than six near-identical projects. User can override every recommendation.

**Important:** GitHub documents manual pin customization; GraphQL exposes read fields for pinned items, but a supported public mutation for changing a user's profile pins is not established. Deliver a ranked shortlist, clear instructions, and a verification checklist. Do not advertise auto-pinning until an official supported method exists.

**Acceptance:** Deterministic explainable ranking, tie-breaking, role-specific rationale, acceptance tests for no-star and empty accounts, manual selection workflow.

### D. Achievements navigator (P4)

Maintain a versioned achievement catalog with: `id, name, category, source, last_verified, eligibility, conditions, status, required_human_action, verification_method, caveats`.

Classify entries as `available`, `historical/unavailable`, `program-dependent`, or `unverified`. Never guarantee awarding: GitHub controls it and conditions can change. Where no supported achievement-status API exists, require user confirmation or show `unverified` rather than claiming a badge.

Suggested pathways emphasize genuine contributions: useful PRs, constructive review, thoughtful issues/discussions, real repository collaboration, and genuine public projects. Optionally generate a **profile README repo** (a functional GitHub feature) and a **real showcase project starter** if the user wants a project with an actual purpose. Never build networks of automated self-interactions, filler repositories, or meaningless PRs to farm trophies.

**Acceptance:** Each badge has a source and verification date; no fabricated earned-badge claims; clear eligible/ineligible/manual categories; no automatic achievement farming.

### E. Contribution visibility and activity audit (P5)

Explain the graph using GitHub's documented eligibility criteria. Analyze actual events, authorship and email attribution, default or `gh-pages` branch eligibility, standalone vs. fork status, and privacy visibility settings **only when inspectable with permission**.

Treat 2020–present as a *historical analysis interval*, not a request to retroactively generate data. When possible, identify real work that's missing from the graph and recommend legitimate fixes (e.g., add a verified historical commit email to the account; merge genuine work to the default branch).

Suggest a meaningful maintenance queue (docs, tests, reproductions, releases, bug fixes) based on real gaps. New contributions are produced only by completing the work, not by a calendar-filling script.

**Acceptance:** Does not edit, redate, rebase, or force-push history; distinguishes count vs. quality; does not promise that every existing commit is contribution-eligible.

### F. Engineering evolution timeline (P6)

Produce an opt-in, evidence-linked timeline of actual milestones: first public project, substantive releases, external contributions, technology transitions, shipped features, and current focus. Preserve actual chronology and attribute work accurately. Prefer meaningful milestones over an artificial annual progression.

**Acceptance:** No invented dates, experiences, employers, or roles; user can edit narrative but sees provenance and uncertainty.

### G. Guided apply and maintenance (P7)

For supported changes:
- Dry-run preview first, then explicit confirmation and minimal permissions.
- Prepare patches or PRs to profile README; never overwrite customizations silently.
- Suggest missing repo descriptions/topics and show manual steps if official API permissions are unavailable.
- Optional scheduled *read-only* audits; reports only when meaningful data changes.

**Acceptance:** Idempotent generation; safe reruns; no unsolicited commits; explicit grant for every write surface; easy rollback or discard.

## 5. Release sequence

| Phase | Deliverable | Done when |
| --- | --- | --- |
| **P0** | Product spec, initial architecture, issue roadmap, contribution standards | Public plan and traceable work items exist |
| **P1** | TypeScript CLI + GitHub read adapter + JSON/Markdown audit | Public profile audit works with fixtures and a real account |
| **P2** | README templates + content validation + preview/diff | Editable professional draft generated from actual facts |
| **P3** | Repository ranking + 60-second action plan | Up to six suggestions with evidence and manual pin instructions |
| **MVP** | P1–P3 packaged as `gh-aura` CLI | Fresh install, end-to-end tests, sample reports, documentation |
| **P4** | Achievement catalog and navigator | Catalog sources verified; statuses clear; no farming |
| **P5** | Contribution diagnostics | Real historical work and missing attribution distinguished |
| **P6** | Evidence-backed career timeline | Timeline generated without touching Git history |
| **P7** | Guided apply, scheduled review, optional UI | Explicitly approved changes, diff, rollback, privacy controls |
| **v1.0** | Reliability, package publishing, accessibility, maintenance | Documented security model and reproducible release process |

**Priority rule:** Ship a useful 60-second report and a strong README *before* gamification or full automation.

## 6. Success criteria

**MVP release gates:**
- Zero GitHub write permissions needed for public-mode audit.
- 100% of recommendations include a specific observation and an action.
- Sparse/empty profiles produce a useful plan rather than erroring or hallucinating.
- README renderer passes deterministic snapshots for three templates and does not introduce unsupported claims.
- Pins ranking is inspectable, configurable, and has manual override.
- Every mutation (later phases) is dry-run and consent-first; no history rewrite.

**User test:** Show the original and proposed profile presentation to a small set of reviewers. Ask what the developer builds, which projects matter, and what evidence is inspectable after 60 seconds. Track comprehension and relevant click-through, **not** arbitrary contribution counts.

**Operational signals:** time-to-first-report, API failure handling, useful recommendations accepted, false-positive findings, regeneration noise, and user trust in the proposed content.

## 7. Risks and constraints

- GitHub rate limits, private repo permissions, and missing GraphQL data: cache and degrade gracefully.
- Existing README and user-provided facts may be incomplete: ask for evidence, mark unknowns.
- Stars often correlate poorly with professional value: low weight and user override.
- Achievement criteria and availability change: source each rule and keep last-reviewed timestamps.
- Some settings require GitHub UI interaction; do not imitate them through fragile web automation.
- AI output can invent skills or links: optional opt-in and fact checking; never grant the model raw tokens.

## 8. Initial implementation backlog

1. Create project skeleton, package scripts, CI, unit tests and release policy.
2. Define `ProfileSnapshot`, `RepositorySnapshot`, `Finding`, `Action`, and `Evidence` schemas.
3. Implement rate-limit-aware GitHub data ingestion and fixtures.
4. Build audit rules and report renderer.
5. Implement profile README generator with three templates.
6. Implement showcase-ranking and recommendation explanations.
7. Build CLI end-to-end tests against public fixtures; manually test on an authorized real profile.
8. Publish MVP docs and sample reports.
9. Add achievement catalog and contribution diagnostics, with documented limitations.
10. Add explicit write authorization only after read-only flows stabilize.

## 9. Official platform references (reviewed 2026-11-11)

- [Profile README](https://docs.github.com/en/account-and-profile/how-tos/profile-customization/managing-your-profile-readme)
- [Pinning items to your profile](https://docs.github.com/en/account-and-profile/how-tos/profile-customization/pinning-items-to-your-profile)
- [Contribution eligibility and attribution](https://docs.github.com/en/account-and-profile/reference/profile-contributions-reference)
- [Missing contributions troubleshooting](https://docs.github.com/en/account-and-profile/how-tos/contribution-settings/troubleshooting-missing-contributions)
- [Private contributions and achievements visibility](https://docs.github.com/en/account-and-profile/how-tos/contribution-settings/manage-visibility-settings-for-private-contributions-and-achievements)
- [GraphQL user pinnedItems (read)](https://docs.github.com/en/graphql/reference/users)
- [REST user profile update permissions](https://docs.github.com/en/rest/users/users)

This roadmap is an implementation plan, **not** a claim that these capabilities currently exist in GH Aura.
