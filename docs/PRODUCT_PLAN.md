# Product scope and acceptance

**Current release:** v1.17.0

The four primary modules are implemented. AI-first use now includes a curated source registry, editable ProfileSpec, portable Agent Skill and local MCP tools. A passed CI test does **not** establish an actual GitHub award or production-write success.

| Module | Shipped behavior | Evidence | Remaining gate |
| --- | --- | --- | --- |
| Activity | Read contribution history; offline date plans; apply synthetic practice to one private workspace | Unit/local Git + live **read-only** checks | Real private write and contribution attribution |
| Badges | Eligibility catalog; three private event attempts; two-account read-only check; tiers and atomic Git batching | Mock API + local bare Git checks | Verify awards and private GitHub push on disposable account |
| README | Draft styles, flexible AI art directions, en/es, review diff, direct/PR publication | E2E mocked GitHub publishing | Independent first-use study |
| Pins | Rank public repos with evidence and role preferences | Unit + read-only integration | User pins manually on GitHub |

Additional commands: `audit`, `work`, `config`, `story`, `brief`, `references`.

## Release policy

Only the **latest published GitHub Release** has downloadable assets. On successful release publication, CI removes older published release objects **without deleting their Git tags or Git history**. No npm registry publication is configured.

## AI-first acceptance

MCP protocol/packaging is tested offline; independent compatibility checks with three real agent clients and user studies remain **unverified**. Agents can inspect and preview, not publish. The user approves changes separately.

## Open gates

- **P0:** Repository administrator must enable `main` branch protection and required checks — [#47](https://github.com/ibbuilds/gh-aura/issues/47).
- **P1:** Validate real Activity/Badges private writes — [#48](https://github.com/ibbuilds/gh-aura/issues/48), including actual achievements — [#53](https://github.com/ibbuilds/gh-aura/issues/53).
- **P2:** Independent usability study — [#49](https://github.com/ibbuilds/gh-aura/issues/49).
- **Optional:** Safe workspace deletion [#52](https://github.com/ibbuilds/gh-aura/issues/52); npm distribution [#50](https://github.com/ibbuilds/gh-aura/issues/50).

No production private repositories, additional accounts, official achievement API or automatic profile pins are assumed. Generated exercises are explicitly synthetic.

[Validation checklist](RELEASE_READINESS.md)
