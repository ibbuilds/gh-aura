# GH Aura 1.3.0

Professional engineering profile references with an evidence-first editorial workflow, no hosted service, paid API or mandatory AI.

## Install

Requires Node.js 22+. Download `gh-aura-1.3.0.tgz` from this release and install it locally:

```bash
npm install --global ./gh-aura-1.3.0.tgz
gh-aura init YOUR_USERNAME
```

This release is hosted on GitHub, not the npm registry. Verify the package with `SHA256SUMS.txt`.

## What's new

- **Individual engineer references:** A reproducible 100-account study selected from company GitHub organizations, with matching self-described company and engineering role. These public signals do **not** confirm employment.
- **Employer-sourced profiles:** Sixteen accounts cross-referenced with company-owned engineering author pages; roles may have changed since publication.
- **`references` command:** Inspect source-linked example profiles entirely offline, with `--company` and `--json`.
- **Company-aware writing:** `editorial.targetCompany` can personalize prompts toward an application target, never imply you already work there.
- **No borrowed résumés:** The writer distinguishes another engineer's presentation structure from your actual work and refuses instructions to invent employer, seniority, awards or impact.

No biographies, emails or raw profile README prose were copied into the research data. The larger datasets and collectors are excluded from the installable runtime package. The study is descriptive, not an analysis of interviews or hiring outcomes.

## Suggested workflow

```bash
gh-aura config set editorial.targetRole "Backend engineer"
gh-aura config set editorial.targetCompany "Microsoft"
gh-aura references --company Microsoft
gh-aura audit --inspect 6 --stats
gh-aura brief --prompt --output writer.txt
gh-aura profile --visual 20 --output draft.md
gh-aura check --file draft.md
gh-aura preview --file draft.md --save review.json
# Only after reviewing the exact diff:
gh-aura apply --review review.json --pr
```

You may draft manually or with any editor/AI. GH Aura does not invoke a provider, publish without explicit approval, create fake historical contributions, grant achievements or modify pins automatically.

The release is gated on CI across Node 22/24 on Linux, macOS and Windows, offline tests, package installation and live **read-only** GitHub integration. Publication tests never modify the user's real account.
