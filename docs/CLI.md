# Command reference

Run `gh-aura COMMAND --help` for allowed flags. Commands reject irrelevant or contradictory options. `-h`, `-V` and `-o` alias help, version and output. `plan` remains a compatibility alias for `audit`.

## Account and configuration

`gh-aura init USER` saves `.gh-aura.json` locally. Pass `--config FILE` for another file; `--force` permits replacing an existing local file, never forcing a GitHub update.

```bash
gh-aura config show
gh-aura config get profile.style
gh-aura config set profile.style regular
gh-aura config set profile.headline "Backend systems and developer tools"
gh-aura config set profile.sections.technologies false
gh-aura config set profile.featured '["USER/project"]'
gh-aura config set profile.technologies '["TypeScript","Python"]'
gh-aura config reset profile.sections.technologies
gh-aura config set showcase.weights.popularity 5 --dry-run
```

Use JSON for arrays, booleans and numbers; quote text with spaces. Unknown keys or invalid values fail without saving. Configuration contains preferences, never credentials. Supported groups are `user`, `scan`, `profile`, `showcase`, `achievements` and `editorial`; `config show` lists every effective value.

Limits: `scan.maxRepos` 1–500, `scan.inspectRepos` 0–20, `scan.maxRequests` 1–500, `profile.maxProjects` 0–6. Explicit featured projects are not padded. Exclusions win.

## Inspect and draft

```bash
gh-aura audit --inspect 6 --stats
gh-aura audit OTHER_USER --json --output report.json
gh-aura showcase --goal "platform engineer" --limit 4 --inspect 6
gh-aura profile --style minimal --output draft.md
gh-aura profile --visual 20 --output restrained.md
```

Inspection adds sampled public README reads. Conventional headings are heuristic signals, not proof of code quality. Scores concern presentation evidence, not engineer quality or hiring probability. Unknown information is not a negative finding.

`--output` writes a local file; status goes to stderr so stdout stays useful for data. Existing output files require `--force`.

### Visual intensity

`--visual N` or `profile.visual` accepts an integer 0–100. Below 35 uses compact layout; 35–69 uses structured layout; 70–100 uses visual layout. Optional language-label density increases with the number; metrics default on at 85. Explicit section switches and user-selected projects always win. No percentage changes history, skills, seniority or achievements.

Use `profile.visual = -1` (or `config reset profile.visual`) to inherit `profile.style`. An explicit command-line `--style` overrides a saved visual value for that command. `--style` and `--visual` cannot be supplied together. The thresholds are product choices, not hiring-study results.

### Preserve custom text

`profile --keep --output draft.md` preserves your current README outside one region bounded by `<!-- gh-aura:start -->` and `<!-- gh-aura:end -->`. First use appends rather than guesses what to delete; remove duplicated text from the draft yourself before preview. Multiple/malformed markers fail closed. Plain generation skips the existing README; `--keep` fetches it.

### Measure and limit reads

```bash
gh-aura audit --inspect 6 --budget 20 --stats
gh-aura profile --fresh --stats --output draft.md
```

`--stats` reports request count, decoded response bytes, cache hits, elapsed milliseconds and current RSS as JSON on stderr. It never includes tokens or request headers. RSS is not peak memory. Defaults are 60 HTTP requests, 2 MiB per JSON response and 32 MiB total response data for one read command. `--budget N` overrides the request cap; it does not increase GitHub's rate allowance.

Public GET caching lasts five minutes and revalidates with ETags. `--fresh` bypasses it; `GH_AURA_NO_CACHE=1` disables it. `GH_AURA_CACHE_DIR` selects a directory. Cached observations are not live data. Preview and apply always read live state. See [free operation](FREE.md) and [measurements](PERFORMANCE.md).

## Writing and local checks

```bash
gh-aura config set editorial.targetRole "Backend engineer"
gh-aura config set editorial.language es
gh-aura config set editorial.maxWords 180
gh-aura brief --output brief.json
gh-aura brief --prompt --output writer.txt
gh-aura check --file draft.md --brief brief.json
gh-aura check --file draft.md --json --strict
```

`brief` produces bounded JSON; `--prompt` produces instructions plus that JSON for your editor. Language (`en` or `es`) and length guide the external writer; local templates do not automatically translate existing text. The target role is an aspiration, not a verified position. Nothing invokes a model or sends credentials. Detailed limits are in [AI workflow](AI_WORKFLOW.md).

`check` is fully local and flags some placeholders, repeated paragraphs, generic hype, unsupported-looking claims and unsafe link schemes. It is not factual, originality or accessibility certification. With `--brief`, its word target is used unless an explicit `--config` supplies another one. `--strict` exits with status 1 if any heuristic finding exists. Ordinary checks exit 0 after generating their report. Invalid arguments/files also exit 1.

## Review and publish

```bash
gh-aura preview --file draft.md --save review.json
# Read the complete diff before publishing.
gh-aura apply --review review.json --pr
```

The public `USER/USER` repository must exist. The target is its root `README.md` on the reviewed default branch. An absent README can be created; a repository is never silently created. The review file binds the account, branch, path, revision, content and exact draft. Changed draft or remote state requires a new preview. Do not accept untrusted review files.

The direct form remains `apply USER --file draft.md --approve REVIEW_CODE`. Supply `GH_TOKEN` or `GITHUB_TOKEN` through a secure shell/session, restricted to the profile repository. Direct updates need Contents write access; `--pr` additionally needs Pull requests write access. Never place tokens in config, briefs, drafts or AI prompts.

Without `--pr`, the root README is committed directly. With it, a deterministic branch and unmerged PR are created. Matching open PRs are reused; conflicting branches or unrelated changed files are rejected. Neither path bypasses branch protection, force-pushes or merges automatically. `apply --dry-run` fails; use `preview`.

Drafts must be UTF-8, at most 256 KiB and without terminal controls. Previews are limited to 600 lines so incomplete reviews cannot authorize publication. Diffs are inspection output, not patches for `git apply`.

An uncertain write can leave a commit or review branch. Inspect GitHub before retrying; writes are not automatically retried. To undo, restore the previous README into a draft, preview it and publish that exact restoration. No history rewrite is needed.

## Achievements

`achievements` is an offline guide with no configured account; otherwise it adds bounded public PR/star evidence. No count guarantees eligibility or ownership. `achievements.earned` is explicitly self-reported; `achievements.excluded` controls omissions; `achievements.allowPaid` defaults false. Historical, program, paid and community-reported entries remain distinguished. The tool does not award badges or manufacture private-repository interactions.

## Contributions

`contributions --year YYYY` selects a year; `--all` queries annual windows from account creation. GraphQL counts require authenticated read access and reflect the token's visibility, not all professional work. Missing authentication leaves counts unknown.

`--details` adds bounded public release/attributed-commit/PR evidence: three repositories and ten recently updated merged PRs. PR dates are explicitly opening dates, not guessed merge dates. Repository creation is not project start or career level. Email attribution, branch eligibility and private-visibility settings are manual checks. No dates, authors or histories are rewritten.

## API failures

401: token rejected. 403: permissions, rules or quota. 429/rate-limit: obey retry instructions. 409/422 during publication: inspect the current state and preview again. Resource-budget errors: reduce the scan or deliberately adjust the request cap. No automatic quota purchases, account rotation or background retry loops.
