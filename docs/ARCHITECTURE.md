# GH Aura — technical architecture

**Architecture decision:** CLI-only, local-first, **Node.js 22+ and zero runtime dependencies**. No website, dashboard, browser extension, hosted database, or mandatory AI vendor.

The original TypeScript + web-app suggestion has been replaced by a smaller, dependency-free ES module implementation. Add dependencies only when they materially improve correctness or maintainability.

## Existing source layout (v0.1.0)

```text
src/
  cli.mjs           command parser / local output / diff
  config.mjs        defaults, validation, style and section options
  github.mjs        public GitHub API snapshots
  engine.mjs        audit rules / explainable repository ranking
  render.mjs        minimalist, regular and flashy README renderers
  achievements.mjs  community-reported badge catalog and caveats
  inspection.mjs    opt-in project README structure checks
  diff.mjs          bounded local text diff
tests/
  config.test.mjs
  engine.test.mjs
  cli.test.mjs
  fixtures.mjs
.github/workflows/ci.yml
```

No source-code refactoring, source quality grading, remote write adapter, private historical graph importer, or achievement farming is implemented.

## Execution flow

```text
gh-aura [command] [username] [flags]
       |
       v
load validated JSON config (optional)
       |
       +--> achievements (offline guide)
       |
       v
official GitHub REST API (public, read only)
       |
       v
normalized profile snapshot + repository metadata + profile README
       |
       +--> audit / plan -> Markdown or JSON report
       +--> showcase -> explainable recommendations (optional README inspection)
       +--> profile -> one of three editable Markdown drafts
       +--> diff -> bounded local before/after terminal diff
       |
       v
stdout or explicit local file (--output)
```

No GitHub writes exist in the current CLI. Optional `--inspect N` (0–20, default 0) fetches only top-ranked public project READMEs and checks for common setup and usage headings. Missing and not-inspected are intentionally different states.

## Presentation presets

- `minimal`: short headline and proof-focused selected work; no default badges, stats, or animations.
- `regular`: stronger hierarchy and tabular showcased projects; optional repository-language section.
- `flashy`: centered introduction, external shield images, more detailed projects and optional snapshot statistics.

The same fields and section toggles apply to **every** preset. No presets imply experience or technologies that the available data cannot establish. A list inferred from repository language is labeled *languages found in public repositories*, not a claim of expertise.

## Data and explainability

All findings contain an observation, action, source link and severity. Repository ranking is deliberately constrained by evidence available in public API metadata; it is **not** a complete source-code analysis.

Configurable initial ranking weights:
- Declared goal/topic relevance: 30%
- Ownership, nonempty source and language metadata proxies: 25%
- Description, topics and demo/website metadata: 20%
- Recency of actual public changes: 15%
- Popularity (logarithmically discounted): 10%

Forks and archives receive a penalty unless explicitly chosen. The pin advisor does not change pins remotely. Score explanations and user overrides matter more than precise score numbers.

## Permission model

| Feature | Current API access | Write capability |
| --- | --- | --- |
| Public profile audit | GitHub REST public data | None |
| README generator | Public data + local user config | Local file only |
| Showcase advisor | Public repository metadata | Recommendation only |
| Achievement guide | Offline documented/community references | None |
| Historical contributions diagnostics | Planned, authenticated where needed | None |
| Profile apply/sync | Planned | Scoped opt-in changes with review |

Do not log tokens, embed them in the generated README, request access to private data by default, or send them to third-party AI. Env-based token input is optional.

## Historical activity

**Never rewrite or redate history to simulate a career arc.** The planned `contributions` command will inspect existing commit attribution, eligible default/`gh-pages` branch contributions, fork limitations, and private contribution visibility as permissions allow. When a user has genuine existing historical work, provide documented ways to display it correctly. New activity must come from real work.

## Achievements

The static catalog is **not an achievement verifier**. Community-reported triggers are labeled as such, with sources and caveats. Official GitHub achievement program and award criteria are not fully guaranteed or exhaustively available through the current public API. Never claim a user earned a badge without suitable verification.

## Tests and releases

`npm run check` uses Node's built-in syntax validation. `npm test` runs deterministic built-in `node:test` tests, without network access. CI has read-only repository permissions.

Next engineering slices:
1. Improve API failure handling, fixtures, and profile audit fidelity.
2. Add actual repository README checks and better showcase evidence.
3. Add trustworthy historical contributions diagnostics.
4. Add an opt-in, per-change CLI apply workflow, with diffs and rollback guidance.

No UI is planned.
