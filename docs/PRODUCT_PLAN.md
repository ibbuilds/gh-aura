# GH Aura: product and delivery

**Current release:** v1.18.0
**Status:** merged into `main` through PR #73; the published release remains unchanged.

## Goal

Improve the complete GitHub profile through the user's preferred AI or direct commands. The result respects the user's purpose and style and makes their actual work easy to understand.

## Agent workflow

1. Understand the purpose, target role, language and style; reuse information the user has already provided.
2. Inspect their profile and public projects.
3. Use `gh_aura_design_recommend`: request → category → three reference profiles. Styles can be combined, or a category selected explicitly.
4. Read those profiles using the tools in `examples.readNext`; compare biography, README, projects, links and presentation. Request more examples through `gh_aura_profiles_list` when needed. Do not copy identities, text or assets.
5. Compose an original proposal and refine the same ProfileSpec.
6. Preview changes, execute only the authorized plan and verify each operation.

The index contains 100 unique profiles, with 12 or 13 primary references in each of eight categories. Secondary styles describe hybrids without duplicating category counts. Each reference includes an observed presentation pattern, a linked public work example and a check date. Selection considers readable presentation and inspectable work; titles and popularity do not determine inclusion. The original eight links remain recorded as provenance, including those outside the active selection. Sources are consulted when designing; if a reference is unavailable, choose another. Markdown, media and designs beyond the index remain supported.

## Features

| Component | Behavior |
| --- | --- |
| README | Original composition, combined styles, selected projects and authorized assets; initial publication or updates through a reviewed PR/commit |
| Biography and account fields | Sidebar biography up to 160 characters and explicit changes to supported public fields |
| Repositories | Paginated scanning, goal-based selection, evidence and description/topics/README proposals; pins are prepared and checked, with final selection through GitHub |
| Achievements | Viable free exercises and campaigns with one or two authorized identities in a marked private workspace; GitHub determines awards |
| Contributions | Daily targets and previews against the observed baseline, in the same workspace; GitHub determines attribution and colors |

## Minimal implementation

Node 22+, zero runtime dependencies. CLI, Skill, MCP and portable prompts share handlers. The agent chooses the design; the core inspects, validates and executes exact operations. Plans preserve targets, content, budgets and prior revisions; uncertain writes are reconciled before retrying.

The owner configures execution permissions. The model cannot authorize itself. External sources are untrusted data. Synthetic activity is not presented as professional experience.

## Verification and delivery

- `npm test`: product behavior, including adverse cases.
- `npm run check`: syntax.
- `npm run test:package`: install and run the tarball, Skill and MCP offline.
- CI: Node 22/24 on Windows, macOS and Linux, plus public read-only GitHub integration.
- `npm run test:research`: optional historical archive verification, outside the runtime.

A PR must be reviewed at its final revision and pass its checks before merging. The owner reserved private-account pilots. Client installation/activation and user outcomes are claimed only after they have been tested. Awards and hiring outcomes are not guaranteed.

[Full workflow](IMPROVE.md) · [Commands](CLI.md) · [Architecture](ARCHITECTURE.md) · [Validation](RELEASE_READINESS.md)
