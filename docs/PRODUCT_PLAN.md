# GH Aura — product scope and status

**Current release:** v1.7.1 cleanup; Node.js 22+, CLI-only, zero runtime dependencies. GH Aura is user-directed, free to run, and does not require an AI provider, server, browser dashboard or subscription.

## The product

GH Aura helps developers show **real, inspectable work** clearly on GitHub. It has four independent modules:

| Module | Shipped CLI | What it does |
| --- | --- | --- |
| Activity | `activity` / `contributions` | Read actual years/date ranges, explain private visibility and missing attribution, inspect local Git author data, suggest future genuine work |
| Achievements | `badges` / `achievements` | Source-linked badge opportunity registry, eligibility caveats, selected evidence and genuine-task preparation |
| Profile | `readme` / `profile` | Minimal, regular or flashy README drafts; 0–100 visual intensity, en/es labels, section/project/story overrides, optional external writing |
| Showcase | `pins` / `showcase` | Rank up to six public projects for the intended role and inspect documented project evidence |

Supporting commands: `audit`, `config`, `story`, `brief`, `check`, `references`, `preview`, `apply`, `work`.

## Write boundary

Public analysis, profile reference browsing and drafting are read-only. Only these commands can write remotely, **after reviewing an exact diff and approving a live revision**:

- `apply --review FILE`: update the public `USERNAME/USERNAME` profile README; optionally `--pr` for an unmerged PR.
- `work apply --review FILE`: open an unmerged PR with one user-authored `README.md` or `docs/**/*.md` documentation change. A scoped token is required; private repos require explicit consent.

No background commits, Git history rewrites, fabricated contribution events, automatic profile pins, automatic badge awards, or bypass of normal repository reviews.

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

Active work is tracked in [GitHub Issues](https://github.com/ibbuilds/gh-aura/issues). The current shipped command syntax is documented in [CLI.md](CLI.md); **do not treat old proposals as released features**.

[Architecture](ARCHITECTURE.md) · [Security](../SECURITY.md) · [Contribution guide](../CONTRIBUTING.md)
