# GH Aura

A small CLI for a professional GitHub profile. Inspect your work, draft your README, review the changes, and publish only what you approve.

**Node.js 22+ · No runtime dependencies · No dashboard · No mandatory AI**

## Start

```bash
git clone https://github.com/ibbuilds/gh-aura.git
cd gh-aura
npm link

gh-aura init YOUR_USERNAME
gh-aura audit
gh-aura profile --output draft.md
gh-aura preview --file draft.md --save review.json
```

Read the diff and edit the draft as needed. Publishing is a separate command:

```bash
gh-aura apply --review review.json
```

`apply` requires `GH_TOKEN` or `GITHUB_TOKEN` with **Contents: read and write**, restricted to your public `USERNAME/USERNAME` profile repository. It updates only that repository's root `README.md`. A changed draft, branch or remote README invalidates the review. Nothing runs in the background.

The source can also run without installation: `node src/cli.mjs --help`. The npm registry package is **not published**; use this repository or a packaged GitHub release.

## Commands

| Command | Purpose |
| --- | --- |
| `init USER` | Save your account and local preferences once |
| `audit --inspect 6` | Inspect profile metadata and six project READMEs |
| `profile --style minimal` | Generate an editable Markdown draft |
| `preview --file draft.md --save review.json` | Compare the exact draft and save its review |
| `apply --review review.json` | Publish the reviewed README |
| `showcase --goal "backend engineer"` | Recommend projects to pin, with reasons |
| `achievements` | List opportunities, preferences and relevant public evidence |
| `contributions --all` | Inspect contribution years and repository milestones |
| `brief --output brief.json` | Export context for your preferred editor or AI |
| `config show` | View effective settings |

Run `gh-aura COMMAND --help` for options. Pass a username to any account command to override the saved one. Reports support `--json`; drafts are Markdown.

## Your style

| Preset | Default presentation |
| --- | --- |
| `minimal` | Short introduction, selected work, contact links |
| `regular` | More structure, project table, repository languages |
| `flashy` | Centered introduction, technology labels and optional metrics |

```bash
gh-aura config set profile.style minimal
gh-aura config set profile.sections.stats false
gh-aura config set profile.maxProjects 2
gh-aura config set profile.featured '["YOUR_USERNAME/project-one"]'
gh-aura config set achievements.excluded '["yolo","quickdraw"]'
```

Every section is optional. Explicit project selections are exact, not padded with other repositories. `flashy` uses Shields.io images; those are technology labels, **not earned GitHub achievements**.

## Boundaries

Public audits work without a token, subject to API limits. Annual contribution data requires authenticated read access. Achievements remain GitHub-controlled: the CLI shows sourced opportunities and evidence, not guaranteed awards. User-recorded achievements are labeled self-reported. Historical awards are not newly earnable.

Showcase rankings use metadata and optional README checks, not a claim of code quality. Pin selection remains manual in GitHub. Contribution history is analyzed, never invented or backdated. The tool does not edit your bio, photograph, pins or unrelated repositories.

## Development

```bash
npm run check
npm test
npm run test:package
```

CI tests Node 22 and 24 on Linux, macOS and Windows. Live integration checks are read-only; publishing tests use isolated fixtures. `npm run test:live` requires a token and reads `ibbuilds` by default.

[Command reference](docs/CLI.md) · [AI workflow](docs/AI_WORKFLOW.md) · [Architecture](docs/ARCHITECTURE.md) · [Security](SECURITY.md) · [Contributing](CONTRIBUTING.md) · [Changelog](CHANGELOG.md)

MIT license.
