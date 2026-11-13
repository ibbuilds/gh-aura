# Product scope and acceptance

**Current release:** v1.18.0

GH Aura is a **local-first, model-agnostic GitHub profile toolkit** with a complete dependency-free CLI and optional AI integrations. It helps people show genuine work clearly, in their own style.

| Area | Delivered | Still unverified |
| --- | --- | --- |
| README | Original AI briefs, editable composition, **29 active sources**, **25 techniques**, optional custom resources, biography voice and evidence, safe local preview | Real-agent and user usability |
| Pins | Rank real public projects against target roles | Owner manually pins |
| Activity | Read contribution history; bounded synthetic private plans | Real contribution attribution |
| Badges | Catalog, three private event candidates, verified-access preflight, atomic PR batching | GitHub awards on real accounts |

## Offline-first composition and optional AI

The local MCP and Agent Skill expose read-only context, source/license discovery, original biography guidance, project evidence, independent visual controls, Markdown checks and diffs. Models can request arbitrary compositions within GitHub's Markdown limits: from plain text to custom original imagery. External services and user-provided source JSON are **opt-in**. No AI vendor or fixed README template is required.

No AI tool can mint a publication approval or write to GitHub. The person independently saves the result and authorizes `preview` followed by `apply`.

## Curated design research

The 100-README archive remains available, but its former **25-reference shortlist is provisional and no longer enters generated briefs by default**. Of 600 candidates, 561 have public GraphQL + HTML observations; 500 complete-profile reviews across avatar, bio, links, README, pins, activity and achievements still require editorial and mobile/theme checks. Category winners require full editorial and visual validation. No GitHub Pages product surface is planned.

## External acceptance

- Main branch protection and required CI: [#47](https://github.com/ibbuilds/gh-aura/issues/47).
- Authorized disposable private repository tests: [#48](https://github.com/ibbuilds/gh-aura/issues/48), actual achievements: [#53](https://github.com/ibbuilds/gh-aura/issues/53).
- Three real agent-client walkthroughs and independent user study: [#61](https://github.com/ibbuilds/gh-aura/issues/61), [#49](https://github.com/ibbuilds/gh-aura/issues/49).

CI tests Node 22/24 on Windows/macOS/Linux, local Git/mocked API and read-only public GitHub. This is **not** proof of awarded badges, hiring impact or compatibility with every agent client. Only the latest GitHub Release retains assets; historical Git tags remain.
