# GH Aura — Architecture proposal

**Status:** Proposed, not implemented. Keep the first release small and local-first.

## Architecture at a glance

```text
GitHub public REST / optional authenticated GraphQL
                   |
                   v
        GitHub adapter (read-only)
                   |
                   v
     Normalization + provenance + cache
                   |
          ProfileSnapshot
                   |
        +----------+-----------+
        |          |           |
        v          v           v
   Audit rules  README studio  Showcase ranker
        |          |           |
        +----------+-----------+
                   |
             ActionPlan
                   |
             Report / CLI
                   |
        [explicit user review]
                   |
          Optional write adapter
```

Additional modules after MVP: achievement catalog + status tracker, contributions visibility analyzer, career timeline, scheduled read-only review.

## Stack

- Node.js **22+**, TypeScript (strict), package manager **pnpm**.
- CLI: `commander`; GitHub: `@octokit/rest` and GraphQL requests when necessary.
- Runtime schemas: `zod`. Testing: `vitest`. Formatting and linting: `prettier` and `eslint`.
- Markdown renderer should emit plain Markdown first; rich preview can be local and opt-in later.
- Use official supported GitHub APIs; never rely on unauthorized scraping or UI automation.
- AI assistance is an optional separate adapter, **not** required for deterministic audit or recommendation logic.

Keep the MVP as one TypeScript package. Extract packages or add a web app **only when** real use demonstrates that split is needed.

## Proposed layout (not yet created)

```text
gh-aura/
├── src/
│   ├── cli/                 # commands, args, output
│   ├── github/              # API adapter, auth and rate limiting
│   ├── domain/              # typed snapshots, evidence and findings
│   ├── audit/               # deterministic audit rules
│   ├── recommendations/     # roadmap, ranking and explanations
│   ├── render/              # README templates and reports
│   ├── achievements/        # versioned source-backed catalog (later)
│   ├── contributions/       # visibility attribution (later)
│   └── apply/               # separately authorized writes (later)
├── templates/
│   └── profile/             # minimal, engineering, open-source
├── tests/
│   ├── fixtures/            # sanitized deterministic snapshots
│   ├── unit/
│   └── integration/
├── docs/
│   ├── PRODUCT_PLAN.md
│   └── ARCHITECTURE.md
├── package.json
├── tsconfig.json
└── README.md
```

## Domain contracts (illustrative)

```ts
type Evidence = {
  sourceUrl?: string;
  observation: string;
  observedAt: string;
  confidence: "verified" | "inferred" | "user_supplied" | "unknown";
};

type Finding = {
  id: string;
  category: "profile" | "showcase" | "repository" | "achievements" | "contributions";
  severity: "high" | "medium" | "low" | "info";
  evidence: Evidence[];
  whyItMatters: string;
  recommendation: string;
  automatable: boolean;
  requiresConfirmation: boolean;
};

type RecommendedRepository = {
  fullName: string;
  breakdown: Record<string, number | null>;
  rationale: string[];
  limitations: string[];
};
```

A `ProfileSnapshot` references normalized GitHub profile metadata, repository snapshots, README existence/content where available, existing featured/pinned items where accessible, and observation timestamps. Do not treat unavailable data as a negative result.

## Modes and permissions

| Mode | Access | Can mutate GitHub? |
| --- | --- | --- |
| Public audit (default) | Public GitHub data, no token required (subject to rate limits) | No |
| Authenticated audit | Opt-in fine-grained read permissions | No |
| Draft/preview | Local files only | No |
| Apply | Separate scope + explicit approval + per-file diff | Yes, only approved resources |

**Never** log tokens, send raw authentication to AI prompts, commit secrets, persist private repo snapshots without opting in, or give an LLM direct write access.

Use environment/GitHub CLI credential lookup securely. Support request retry and API rate limiting without denial-of-service behavior.

## Profile vs. repository mutations

- Profile README: prepared as a local file; optionally propose a PR to `username/username` after permissions and user review.
- Public profile fields: read for audit; update only if supported by the relevant official API and separately authorized profile write scope.
- Pins: rank and explain; instruct user to select up to six in GitHub UI. No public supported auto-pin mutation is assumed.
- Repos: audit metadata/docs to improve their *presentation*; no general bulk code changes.
- Achievements: GH Aura reports and recommends; GitHub awards. If status can't be verified through supported methods, label it unknown.
- Contributions: audit and troubleshoot real work; never backdate or rewrite history.

## Validation & release gates

1. Offline unit tests for audit rules, schema parsing, and ranking edge cases.
2. Sanitized fixtures for empty account, no README, private-only account, many repos, fork-heavy account, stale repositories.
3. Snapshot tests for each README style and non-hallucination rules.
4. API integration tests with mock rate limits, 404, 403, 429, pagination, incomplete data, and token expiry.
5. Smoke test on an authorized public profile, with no mutations.
6. `--dry-run` default for any later write command; idempotency and rollback checks.
7. Standard CI (lint/typecheck/test/build) required before release.

## First three vertical slices

- **Slice 1:** `audit --user <login>` -> profile snapshot -> three evidence-backed findings -> `report.md` + `report.json`.
- **Slice 2:** existing report -> `readme --style minimal` -> Markdown draft -> visual review.
- **Slice 3:** full repository inventory -> ranked, explained pin shortlist -> printable manual steps.

Do not expand into automated achievements, activity schedulers, or a web dashboard before these three slices are reliable.
