# Contributing

Keep GH Aura a small, user-directed CLI. Add dependencies only when they materially improve correctness or maintainability.

```bash
npm run check
npm test
npm run test:package
```

Node.js 22+ is required. Unit and subprocess tests run offline; `test:package` packs, installs and executes the actual distribution without registry access. CI covers Node 22/24 on Linux/macOS/Windows. `npm run test:live` requires a token and performs read-only public GitHub integration checks; never publish to a personal profile in tests.

Submit focused branches and PRs. Update command help and docs when behavior changes. Add regression tests for bugs, including invalid input, unavailable data and publication conflicts. Missing evidence must not become an invented claim or a negative score.

All reads and drafts must remain free of remote writes. A new mutation requires a narrow target, explicit user command, review artifact and current-revision validation. Keep credentials out of fixtures and AI context.

Releases are produced only from `main` after CI succeeds. A new package version creates a GitHub release with a tarball and checksum; existing releases are never overwritten. npm registry publication is separate and is not configured.
