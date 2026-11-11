# Performance and resource budgets

Optimize measurable work, not an untestable claim of being "maximally optimized".

## Reproduce

```bash
npm run benchmark
gh-aura profile YOUR_USERNAME --fresh --stats --output draft.md
gh-aura audit YOUR_USERNAME --inspect 6 --budget 20 --stats --json
```

`--stats` emits token-free JSON to stderr: request count, decoded response bytes, cache hits/revalidations, elapsed milliseconds and current RSS. RSS is a point-in-time measurement, not peak memory. HTTP compression means decoded response bytes are not necessarily wire traffic.

## Deterministic regression fixture

The benchmark uses a public account with two repositories, an existing root profile README, no token and no optional inspections:

| Plan | HTTP requests |
| --- | ---: |
| Previous plain-draft read plan, including the unused existing README | 4 |
| Current plain-draft read plan | 2 |
| Current repeated read with a warm local cache | 0 |

These are fixture counts enforced in tests, not a universal 50% latency improvement. Large inventories paginate; inspection, authentication visibility checks and network conditions change real costs. `--keep`, `brief`, `audit` and `diff` still fetch context they use. Preview/publication always check live state and never reuse stale cache data.

## Bounds

Public read commands share one request session. Defaults: 60 HTTP attempts, 2 MiB per decoded JSON response and 32 MiB of decoded response data across an invocation. `--budget N` or `scan.maxRequests` adjusts the request bound from 1 to 500. These do not raise GitHub's own quotas. Oversized streams are cancelled and partial data is never presented as complete. The bounds are not a total process-memory guarantee; parsing, cache data and Node.js require additional memory.

Existing serial access, ETags, short public caching and rate-limit stops remain. No proxy rotation, undocumented scraping, hidden polling or paid quota is added.

## Startup and editorial context

Help and argument validation import only the parser and text helpers. Local settings/checks, read operations and reviewed publishing are separate lazily loaded handlers. Publication does not load the cohort or editorial checks.

The compact editorial data is capped at 12,000 bytes; long existing-README excerpts shrink from a 24,000-character cap to 1,200. Briefs with small inputs can include more context than before because they now include provenance and explicit writing constraints. No universal token-price or memory-reduction claim is made.

The 100-account research collection is a deliberate developer operation. Runtime commands use a small committed aggregate and never fetch the cohort. The full research dataset and collector are excluded from the installed tarball.

## Verification boundary

Unit/subprocess tests enforce budget stops, byte bounds, no writes through read sessions, strict local checks, corpus/aggregate integrity and fixture request counts. The live read-only test also executes the refactored CLI and its prompt exporter against GitHub. Publishing tests remain isolated; no personal profile is mutated to benchmark the product.
