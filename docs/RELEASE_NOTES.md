# GH Aura 1.5.0

**A user-directed CLI for a credible, explainable GitHub portfolio.** No hosted service, mandatory AI, npm-registry subscription or runtime dependencies.

## Installation

Requires Node.js 22+. Download the `gh-aura-1.5.0.tgz` attachment from this GitHub Release, verify it with `SHA256SUMS.txt`, then run:

```bash
npm install --global ./gh-aura-1.5.0.tgz
gh-aura init YOUR_USERNAME
```

The install package is released on GitHub, not the npm registry.

## Delivered since v1.4.0

- **Real activity windows:** `contributions --from 2020 --to 2026 --days` reads calendar data in bounded, batched GraphQL windows. `--recover` provides manual attribution checks for actual historical work. No artificial green-square commits or timestamp rewriting.
- **Achievements capability guide:** `achievements --plan --scope free` distinguishes reported collectible achievements, unavailable historical badges and paid/program conditions. `achievements --prepare BADGE --repo USER/PROJECT` drafts a plan for meaningful work, optionally referencing existing public issues; **does not create code, PRs, badges or third-party engagement**.
- **Selected project evidence:** `audit --deep 2` or `showcase --deep 2` inspects public Git tree path structure for test, CI, manifest, architecture and example files without executing untrusted code. These are file-presence signals, not test/quality certification.
- **Personal contributions and portfolio presentation:** `profile.projectStories` can hold user-confirmed project descriptions, work, trade-offs, outcomes and proof links; minimal/regular/flashy output respects selected repos and section switches.
- **Two deterministic README languages:** `profile --language es` emits Spanish headings and section labels, while preserving user claims and code references verbatim. English is default; no translation API.
- **Private, local job-description mapping:** `audit --job vacancy.txt --deep 2` parses a local UTF-8 file (at most 64 KiB), checks recognized terms against selected public repo metadata and user-supplied project stories, and reports what is observable or unknown. The entire posting stays on your machine, is not copied into reports and is not sent to GitHub or an AI service.

## Recommended workflow

```bash
gh-aura contributions --from 2020 --to 2026 --recover
gh-aura achievements --plan --scope free
gh-aura audit --goal "Backend Engineer" --job vacancy.txt --inspect 3 --deep 2
gh-aura profile --language es --style minimal --output draft.md
gh-aura check --file draft.md
gh-aura preview --file draft.md --save review.json
# Only if you approve the complete diff and have a scoped token:
gh-aura apply --review review.json --pr
```

### Security and honesty

- No claim that text matches prove qualifications or improve interview probability.
- No automatic achievement granting, fake PRs, synthetic stars or contribution farming.
- Private work is not exposed automatically; private repository eligibility varies by GitHub event and badge.
- Pins are recommended but still selected through GitHub's supported interface.
- Only an explicit `apply` command can change the profile README or open a review PR. User review and revision checks remain mandatory.

CI verifies unit/integration tests, packaging and real **read-only** public GitHub access across Node 22/24 on Linux/macOS/Windows. Remote publication operations are tested through isolated fixtures, never by changing a user's actual profile.
