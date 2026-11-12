# GH Aura — product scope and status

**Current release:** v1.9.0 (unified activity and private workspace); Node.js 22+, CLI-only, zero runtime dependencies. GH Aura is user-directed, free to run, and does not require an AI provider, server, browser dashboard or subscription.

## The product

GH Aura helps developers show **real, inspectable work** clearly on GitHub. It has four independent modules:

| Module | Shipped CLI | What it does |
| --- | --- | --- |
| Activity | `activity` / `contributions` | Inspect actual activity, plan labeled synthetic date ranges and explicitly apply to a reusable private workspace without rewriting existing history |
| Achievements | `badges` / `achievements` | Explore eligibility and attempt bounded private PR/issue exercises in the same workspace; report operations, never promise awards |
| Profile | `readme` / `profile` | Minimal, regular or flashy README drafts; 0–100 visual intensity, en/es labels, section/project/story overrides, optional external writing |
| Showcase | `pins` / `showcase` | Rank up to six public projects for the intended role and inspect documented project evidence |

Supporting commands: `audit`, `config`, `story`, `brief`, `check`, `references`, `preview`, `apply`, `work`.

The four commands share one GH Aura CLI and optional marked private workspace. Observed contribution history and genuine portfolio evidence remain distinct from explicitly labeled synthetic practice; the latter is not evidence of employment.

## Write boundary

Public analysis, profile reference browsing and drafting are read-only. Only these commands can write remotely, **after reviewing an exact diff or dated plan and approving it explicitly**:

- `apply --review FILE`: update the public `USERNAME/USERNAME` profile README; optionally `--pr` for an unmerged PR.
- `activity apply --review FILE --confirm FINGERPRINT --author-name NAME --author-email EMAIL`: create **or reuse** one marked owned private workspace, append dated synthetic practice without force pushing or overwriting paths. Optional `--repo OWNER/REPO` overrides the configured workspace. [Activity guide](CALENDAR.md).
- `badges auto apply --review FILE --confirm FINGERPRINT`: reuse that same marked owned private workspace for bounded PR/issue exercises; may merge sandbox PRs, but **cannot guarantee GitHub awards**. No other repos or participants are touched. [Automation guide](BADGE_RUN.md).
- `work apply --review FILE`: open an unmerged PR with one user-authored `README.md` or `docs/**/*.md` documentation change. A scoped token is required; private repos require explicit consent.

No background activity, no rewriting existing Git history, no automatic profile pins or guaranteed badge awards, and no bypass of project protections. Private-owned sandbox PR merges are an explicitly reviewed exception to the general never-auto-merge documentation PR workflow. Generated practice is labeled synthetic, not historical employment evidence.

## Research

The primary offline reference is a dated structural study of [200 company-associated, ordinary-visibility engineering accounts](../research/ORDINARY_STUDY.md) from 35 organizations. A smaller employer-source cohort is documented separately. Research does **not** establish employment or hiring outcomes. GH Aura does not download reference accounts while generating a README.

## Operating rules

- Use GitHub's documented REST/GraphQL API, request/byte budgets, conditional ETags and a bounded local public cache. Historical/ambiguous data stays `unknown`; private content never leaks through public reports.
- Favor one straightforward command over another abstraction or mandatory configuration step.
- Require a source link and honest confidence label for achievement and project evidence; a README heading or CI config is not passing tests.
- Versioned GitHub releases only after syntax, unit, offline package and live **read-only** integration checks pass on the supported OS/Node matrix.
- Keep generated documentation local until the user intentionally reviews and authorizes publication.

## Limits and future validation

GitHub decides whether events contribute to the graph, which achievements are awarded, and which repositories are actually pinned. A profile cannot guarantee hiring. A 60-second recruiter study has **not** been carried out; [an optional protocol](HUMAN_VALIDATION.md) exists but is not a release prerequisite or evidence of success.

Open external release and validation gates are documented in [release readiness](RELEASE_READINESS.md). Active work is tracked in [GitHub Issues](https://github.com/ibbuilds/gh-aura/issues). The current shipped command syntax is documented in [CLI.md](CLI.md); **do not treat old proposals as released features**.

[Architecture](ARCHITECTURE.md) · [Security](../SECURITY.md) · [Contribution guide](../CONTRIBUTING.md)
