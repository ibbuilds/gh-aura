# Free operation

GH Aura requires a local Node.js installation and a GitHub account, not a paid plan. It has no runtime dependencies, subscription, server, telemetry service, hosted database, mandatory AI provider or paid API integration. It never purchases a plan or sends a payment.

## Authentication is not billing

Public REST data can be read without a token. An optional GitHub personal access token authenticates requests and raises the usual public REST allowance. It does not require GitHub Pro. Use a token restricted to the profile repository for publishing; Contents write access is sufficient for direct updates, and PR mode additionally needs Pull requests write access. Annual GraphQL history requires authenticated read access. Creating an owned private Calendar Studio or badge sandbox needs free GitHub repository creation permission and scoped write access; GitHub may reject token permissions or enforce additional usage limits.

If you independently choose an external AI provider, that provider's terms and costs are separate. Deterministic templates and manual editing work without it. `brief` only writes JSON locally. Paid badge/program entries are disabled by preference and informational, never a required product feature.

## Respect platform limits

As documented by GitHub and reviewed on 2026-11-11:

- Public unauthenticated REST access is normally limited to **60 requests/hour per originating IP**.
- Personal-token REST access normally has **5,000 requests/hour**. Search and GraphQL have separate limits; Actions' built-in token has its own allowance.
- Correctly authenticated conditional GET requests that return **304 Not Modified** do not consume the primary rate limit. Secondary limits still apply.

Free does not mean unlimited. GH Aura stops on rate-limit errors, reports available retry timing and never rotates accounts, buys quota or bypasses controls.

## How calls are reduced

Public analysis reads use a five-minute local cache. After expiry, stored ETags request only changed data. Results are bounded to 128 cache entries/16 MiB, with a 2 MiB entry cap. Keys isolate credentials; token values and request headers are not persisted. GraphQL and errors are not cached.

`--fresh` bypasses caching for a command; `GH_AURA_NO_CACHE=1` disables it. `GH_AURA_CACHE_DIR` chooses another location. Delete the tool's cache directory to remove cached public observations. Cached observations are not live measurements, and may remain visible until their short TTL expires after a public repository changes visibility.

The default audit does not crawl every file. Repository inventory is capped by `scan.maxRepos`, README sampling by `--inspect`, and optional timeline details by three repositories/ten PRs. Commands that do not need the profile README skip fetching it. Authenticated content cache misses check public visibility before reading new contents. Calls are serial, not a burst of concurrent requests.

**Preview and apply never use cached state.** An approved change is checked against the live repository, branch and README revision.

## Repository maintenance costs

CI runs only on public repositories and standard GitHub-hosted runners. GitHub documents that configuration as free. There are no larger runners, Actions artifact uploads, Actions cache uploads, cron workflows or externally hosted services. Private forks skip CI unless their owner deliberately changes the guard; local tests still work.

Installable tarballs and checksums are published as GitHub Release assets after tests pass, not to a paid package registry. No npm account is required to install the release tarball. Ordinary internet/computer costs and any services the user separately selects are outside GH Aura.

## Official references

- [GitHub REST limits](https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api)
- [REST best practices and conditional requests](https://docs.github.com/en/rest/using-the-rest-api/best-practices-for-using-the-rest-api)
- [GitHub Actions billing](https://docs.github.com/en/billing/concepts/product-billing/github-actions)
- [Managing personal access tokens](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens)
