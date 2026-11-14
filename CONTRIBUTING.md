# Contributing

Node.js 22+, no runtime dependencies. Keep GH Aura small, explicit and secure.

Use English for repository documentation, code comments, CLI help and examples. Keep other languages in intentional localization data and multilingual tests.

```bash
npm run check
npm test
npm run test:package
```

CI covers Node 22/24 on Linux, macOS and Windows, plus public GitHub **read-only** integration. Changes need focused PRs, tests, updated help and concise docs. No tokens or private data in tests.

New remote writes require a reviewed plan, narrow target and revision validation. Only green `main` builds publish a new version. CI retains the latest release object, preserving old Git tags and commits.
