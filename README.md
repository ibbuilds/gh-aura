# GH Aura

A small CLI for presenting real GitHub work professionally. Inspect, draft, review, then publish only what you approve.

**Node.js 22+ · No runtime dependencies · No required AI or subscription**

## Start

```bash
git clone https://github.com/ibbuilds/gh-aura.git
cd gh-aura
npm link

gh-aura init YOUR_USERNAME
gh-aura audit --inspect 6
gh-aura profile --output draft.md
gh-aura preview --file draft.md --save review.json
```

Read the diff before publishing:

```bash
gh-aura apply --review review.json --pr
```

`--pr` opens an unmerged review PR. Without it, `apply` updates the root profile README directly. Both require the exact reviewed draft and live revision, plus a token restricted to the profile repository. Only `apply` writes to GitHub. Nothing runs in the background.

Use the repository or a GitHub Release tarball; the npm registry package is not published.

## Commands

| Command | Purpose |
| --- | --- |
| `init USER` | Save your account once |
| `audit --inspect 6 --stats` | Inspect profile/project evidence and measure API use |
| `profile --visual 20` | Generate a restrained draft; `--keep` preserves custom text |
| `preview --file draft.md --save review.json` | Review the exact proposed change |
| `apply --review review.json --pr` | Open a reviewed profile PR |
| `showcase --goal "backend engineer"` | Recommend relevant projects to pin |
| `achievements` | Show opportunities, prerequisites and public evidence |
| `contributions --all` | Inspect authentic activity across available years |
| `brief --prompt -o writer.txt` | Prepare grounded instructions for your chosen writer |
| `references` | Browse source-linked engineer profile examples offline |
| `check --file draft.md` | Check a draft locally; no API or AI calls |
| `config show` | Inspect or change local preferences |

Run `gh-aura COMMAND --help` for options. Existing `minimal`, `regular` and `flashy` styles remain available.

## Presentation, not invented experience

```bash
gh-aura config set profile.visual 20
gh-aura config set profile.sections.stats false
gh-aura config set profile.featured '["YOUR_USERNAME/project-one"]'
gh-aura config set editorial.targetRole "Backend engineer"
gh-aura config set editorial.targetCompany "Microsoft"
gh-aura config set editorial.language en
```

Visual intensity is 0–100: compact below 35, structured at 35–69, visual at 70–100. It changes layout and decorative density, not skills, seniority, history or credibility. Explicit section switches and project selections win. Reset `profile.visual` to inherit a style preset.

## Writing grounded in professional engineer profiles

Our research now separates **100 public company-associated engineering accounts** from **16 engineer profiles connected to employer-owned author or engineering pages**. The first group has public organization membership and matching self-reported employer/role; these signals **do not prove current employment**. The smaller employer-sourced group records official publication links, but those assertions can become outdated. Both datasets record structural features and provenance, **not copied biographies**.

Use `gh-aura references` or `gh-aura references --company Microsoft` to browse source-linked examples without making API requests. The writer uses documented presentation patterns — clear specialization, verifiable contribution and readable featured work — rather than imitating someone's credentials. Setting `editorial.targetCompany` means a company you want to apply to, **not an employer you claim to work for**.

`brief` combines evidence of your own work with these references and writing preferences. `brief --prompt` prepares original instructions for any editor or AI; GH Aura never invokes a model or sends it your token. `check` catches some repetition, placeholders and claims needing review, but does not certify truth or originality. Neither research cohort measured interviews or hiring success.

[Industry research and limitations](research/INDUSTRY_STUDY.md) · [Writing workflow](docs/AI_WORKFLOW.md)

## Resource use

Public reads reuse a short local cache and ETags. Plain draft generation skips the existing README; preservation and review do not. Read commands default to at most 60 requests, 2 MiB per JSON response and 32 MiB of response data per invocation. Use `--stats`, `--fresh` and an explicit `--budget N` when needed. These are application budgets, not extra GitHub quota.

The reference study is not repeated during use. No server, paid model, hosted database or runtime dependency is required. [Free operation](docs/FREE.md) · [Measured performance](docs/PERFORMANCE.md)

## Boundaries

GitHub controls achievements; the tool cannot grant every badge, fabricate historical contributions or certify professional experience. Pins and account settings remain manual. Private-repository activity is not a route to guaranteed awards. Annual history requires authenticated reads. Showcase scores describe presentation evidence, not code quality or hiring probability.

## Development

```bash
npm run check
npm test
npm run benchmark
npm run test:package
```

CI covers Node 22/24 on Linux, macOS and Windows. Live integration is read-only; publication tests use isolated fixtures. The full research dataset stays out of the installed runtime package.

[Command reference](docs/CLI.md) · [Architecture](docs/ARCHITECTURE.md) · [Security](SECURITY.md) · [Contributing](CONTRIBUTING.md) · [Changelog](CHANGELOG.md)

MIT license.
