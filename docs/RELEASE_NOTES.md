# GH Aura 1.0.0

A user-directed CLI for presenting real GitHub work professionally. No dashboard, runtime dependencies or mandatory AI provider.

## Install

Requires Node.js 22+. Download `gh-aura-1.0.0.tgz` from this release and install it locally:

```bash
npm install --global ./gh-aura-1.0.0.tgz
gh-aura --help
```

Alternatively, clone the repository and run `npm link`. This release is not an npm registry publication.

## Workflow

```bash
gh-aura init YOUR_USERNAME
gh-aura audit
gh-aura profile --output draft.md
gh-aura preview --file draft.md --save review.json
# Read the diff before running the separate publish command.
gh-aura apply --review review.json
```

Publishing requires a token restricted to the public profile repository with Contents write access. Draft changes, branch changes and stale remote revisions invalidate review files.

## Included

Three configurable README styles; evidence-backed showcase recommendations; achievement opportunities and selected public evidence; annual contribution history and repository milestones; optional JSON briefs for external editors; explicit reviewed README publishing.

## Verification and limits

CI covers Node 22/24 on Linux, macOS and Windows, packed installation, isolated publishing tests and real read-only GitHub integration. Live tests never modify a personal profile. `SHA256SUMS.txt` records the package checksum.

GitHub controls awards and visibility. Pins remain manual. Achievement ownership is not automatically verified, metadata is not a code-quality certification, and history is never fabricated. The only remote write surface is the profile repository's root README.
