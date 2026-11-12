# Architecture

Local-first Node.js ES modules, no runtime dependencies. The command line is the interface; no daemon, hosted backend or mandatory model provider.

```text
cli.mjs / cli-options.mjs     parse and validate; cheap help path
  commands/local.mjs         settings and offline draft checks
  commands/read.mjs          one bounded/cache-aware read lifecycle
  commands/publish.mjs       explicit reviewed profile publication
  work.mjs                   approved one-file documentation PR workflow

  github.mjs + cache.mjs     official APIs, public visibility, ETags
  session.mjs                request/stream-byte budgets and measurements
  engine.mjs + inspection    evidence-based findings and showcase ranking
  render.mjs                 deterministic layouts and managed regions
  editorial.mjs + brief     writing contract and local heuristics
  reference.mjs              small dated aggregate, no biography corpus
  workflow + pull-request   exact revision/draft approval and guarded writes
```

## Ownership boundaries

The bootstrap does not import network or publishing code for help. Local commands cannot use the read-session or publication path accidentally through a global autonomous runner. Read handlers share one explicit session/cache, while publishing performs fresh reads without that cache. Read-session POST is restricted to read-only GraphQL queries, not mutations.

Recommendations distinguish observed metadata from inferred presentation value. Unknown README content is not a missing file. Stars have low, configurable weight; manual selected projects remain exact. No score certifies engineering quality.

## Writing

An editorial brief contains the account's own evidence, declared preferences, an optional target role, bounded source excerpts and aggregate structural guidance. It never contains a cohort biography or an API credential. The user chooses whether an external editor or model uses it. Local `check` is deliberately heuristic; it does not replace human fact checking or the separate review/apply contract.

Presentation intensity changes layout and optional decoration only. It cannot create experience, historical activity, professional rank or earned achievements.

## Data and resource limits

Public cache entries retain short-lived observations, isolated by credential-derived keys without persisting tokens. Network/JSON budgets are explicit and tested. Optional inspections and historical detail queries stay bounded. The sample of 100 public contributor accounts is versioned research outside the installed package, not a runtime crawler.

## Publication

`preview` reads a live public profile repository and binds the exact draft, repository, branch, path and current content/revision into a review digest. `apply` either updates that reviewed root README or opens an unmerged PR. It rejects stale or conflicting state, unrelated PR changes and mismatched approval. Writes are never automatically retried. `work preview`/`work apply` separately authorize a single user-authored Markdown change under `README.md` or `docs/`, verify the exact diff/remote revision, and create a PR only. Private repositories require explicit opt-in and scoped permissions; no historical contribution or badge is guaranteed. Account settings, pins, achievements and Git history are not mutation surfaces.

## Tests and maintenance

Core logic is unit-tested offline; the subprocess flow uses isolated transport fixtures. Installed-package checks and Node 22/24 matrices cover Linux, macOS and Windows. Live integration is read-only. Deterministic resource assertions run alongside correctness tests. New abstractions require a concrete correctness, resource-use or maintenance benefit, not merely another layer.

## Professional reference data (v1.3)

The CLI has a compact read-only local `reference.mjs` aggregate and source-linked professional examples. Two research sources remain **distinct**: 100 public company-organization members with self-reported company and engineering role (employment **unverified**), and 16 profiles associated with engineering author pages published by employers (sources may be stale). Neither offers proof of hiring outcomes. Research datasets and one-time collectors live under `research/` and `scripts/` but are excluded from the runtime npm tarball; ordinary commands never fetch the 116 reference accounts. `references` executes offline. `brief` selects at most four short source links and structural counts rather than copying profiles, retaining the existing 12 KiB context budget. See [study methodology](../research/INDUSTRY_STUDY.md).

## Hiring-oriented review (v1.4)

`src/readiness.mjs` is a pure, read-only analysis of a normalized public profile snapshot. The existing `audit` CLI adds a role-oriented first-minute review to the current report, without another API call. Every check is `clear`, `needs-work` or `unknown`, with an evidence URL and explicit user action. Documentation signals do not certify runnable code, CI, engineering expertise or ownership. No percentage called “hireability” or prediction of employment is generated. Source and tradeoffs: [Hiring readiness](HIRING_READINESS.md).

## Optional bounded source-structure evidence

`project-evidence.mjs` performs one public Git tree inspection per explicitly selected project (up to five), detecting paths for tests, CI, architecture, examples and manifests with source URLs. Truncated trees yield `unknown`, not negative findings. `--deep` defaults to 0, honors existing API request/byte budgets, and never executes cloned project code. Authenticated reads recheck the public visibility of the selected repository before retrieving its Git tree. No observed file presence is described as passing tests, successful CI, complete architecture or personal authorship. See [Project evidence](PROJECT_EVIDENCE.md).
