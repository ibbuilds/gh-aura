# Contributing to GH Aura

GH Aura is a **CLI-only, user-directed** profile tool. Contributions preserve three invariants:

1. Reading, auditing and drafting never change GitHub remotely.
2. Remote changes require an explicit user command, review artifact, adequate permissions and validated current revision.
3. The tool never fabricates experience, achievements, contributions or Git history.

## Development

Requirements: Node.js 22+.

```bash
git clone https://github.com/ibbuilds/gh-aura.git
cd gh-aura
npm run check
npm test
node src/cli.mjs --help
```

There are no runtime dependencies. Prefer built-in Node APIs over new dependencies unless there is a clear maintenance or security justification.

## Pull requests

- Open a focused PR with a description of the behavioral change and risk.
- Include offline tests for audit, configuration and publishing.
- For GitHub API behavior, mock errors, missing data, rate limits and version conflicts.
- Never use real credentials or publish to a real profile in automated tests.
- Update README/help output whenever a command or flag changes.
- Keep reports evidence-backed. Unknown data must remain unknown.
- Favor readable, accessible Markdown without excessive decoration.

## Reviewing user-facing changes

A change affecting publishing must document exactly which resource it modifies, which token permission it needs, and how the user can review or avoid the write. A change affecting achievements must include credible sources and mark unofficial information accordingly.

Do not add empty commits, contribution painting, automated reactions or badge farming behavior.
