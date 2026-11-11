# Architecture

GH Aura is a local Node.js CLI with no runtime dependencies, hosted service, background scheduler or mandatory AI provider.

```text
command → validated config → public GitHub snapshot → analysis/rendering → stdout or local file
exact draft → remote README → terminal diff → local review → explicit apply → Contents API update or explicit PR
```

## Modules

- `cli`: command routing, help, argument validation, output and executable entry point.
- `config`, `config-cli`: defaults, schema checks and explicit local changes.
- `github`: fixed-origin REST/GraphQL requests, token handling, pagination and error classification.
- `engine`, `inspection`: reproducible showcase rankings and evidence-based findings.
- `render`, `text`, `diff`: Markdown presets, safe external text and bounded review diffs.
- `workflow`, `pull-request`: exact README target, review digest, review files and explicit direct/PR publication.
- `cache`: five-minute, bounded public-read cache with ETag revalidation; never used for publication.
- `achievements`, `contributions`: opportunity catalog, observed activity and explicit data limits.
- `brief`: provider-neutral editorial context with untrusted-data labels.

## Invariants

Audit, drafting and preview never write remotely. Only `apply` can update the public `USER/USER` root README (directly or through an unmerged PR); it binds the current default branch and file SHA to the reviewed draft. Credential-bearing redirects are rejected. Reads can retry one temporary 502/503/504; writes never retry. Errors after a write distinguish an unknown result from a confirmed failure.

Authenticated reads still exclude private repository contents from public-profile exports. No token is stored in config or sent to an AI provider. Unknown data remains unknown. Explicit featured projects are exact and exclusions win. Template metrics are dated observations, not dynamic or verified skill scores.

## Verification

Offline tests cover parsing, config, ranking, render safety, API pagination/errors, contribution windows, approval binding and an isolated subprocess publishing flow. A separate test packs and installs the CLI offline. CI runs Node 22/24 on Linux/macOS/Windows; a read-only integration job exercises official GitHub APIs. Personal profile writes are never part of CI.

CI jobs use read-only repository permissions. A separate release job on `main`, after all checks pass, can publish the package artifact and checksum to a versioned GitHub release. It does not publish to npm or modify a user's profile.

See [CLI reference](CLI.md) and [security policy](../SECURITY.md) for observable behavior and limitations.

Public read caching is enabled by the CLI, not implicitly by the network library. Callers must mark public reads. Token-bearing content cache misses recheck current repository visibility. Keys isolate credentials without storing tokens; cache storage is bounded to 128 entries/16 MiB. GraphQL is not cached. `--fresh` bypasses caching. CI does not upload artifacts or use paid runners and is guarded off for private repositories.
