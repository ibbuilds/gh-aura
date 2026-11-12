# Architecture

A small **Node.js 22+**, ES-module, zero-runtime-dependency CLI. No hosted component, daemon, browser interface, mandatory AI provider or telemetry.

## Main paths

```text
src/cli.mjs + cli-options.mjs       small command parser/help + lazy routing
src/commands/local.mjs             local config, project stories and draft checks
src/commands/read.mjs              bounded read-only GitHub snapshot lifecycle
src/commands/publish.mjs           explicit reviewed profile README writes
src/work.mjs                       explicit reviewed single-file documentation PR
src/github.mjs + cache.mjs          REST/GraphQL adapter and public-only ETag cache
src/session.mjs                    HTTP request/response-size budgets and stats
src/contributions.mjs              real GitHub contribution periods
src/local-attribution.mjs          offline Git author metadata counts
src/achievements.mjs               source-linked achievement capability catalog
src/project-evidence.mjs           optional public source-file and CI observations
src/engine.mjs + readiness.mjs      explainable repo ranking and first-minute review
src/render.mjs + editorial.mjs      deterministic layouts, bounded optional editor brief
src/reference.mjs                  small dated offline reference aggregate
```

No read, plan, draft, or profile-reference command is allowed to mutate GitHub. Only explicit `apply` and `work apply` cross the remote write boundary, after SHA-bound review and fresh revision checks. Neither automatically merges a PR, changes history, grants achievements or edits pins.

## Resources, privacy and data integrity

- Public snapshot reads use a five-minute local cache and ETags; the publishing path bypasses cache.
- Every read has a request and response-byte budget. Optional deep/README/CI checks are **opt-in** and report unknown data honestly.
- Authenticated reads confirm public visibility before exporting previously listed repository content. User-provided job postings and local author email identities are never uploaded.
- No untrusted project code is executed, no raw reference biographies are stored, and GitHub tokens are not embedded in writing briefs.
- GitHub decides contribution attribution and badge awarding; observed metadata and user-supplied stories are classified separately.

## Verification and maintenance

`npm run check`, `npm test`, `npm run test:package` and `npm run test:live` are the main gates. CI runs Node 22/24 on Linux, macOS and Windows, with a strictly read-only public GitHub integration. Remote write cases are covered with isolated test transports.

The normal package ships only `src/`, the top-level README, license, security policy and changelog. Developer research datasets, scripts, CI and detailed documentation remain in the GitHub source repository.

[CLI reference](CLI.md) · [Security](../SECURITY.md) · [Product scope](PRODUCT_PLAN.md) · [Research](../research/README.md)
