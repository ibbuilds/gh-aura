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
gh-aura audit --goal "backend engineer" --inspect 3 --stats
gh-aura audit --inspect 6 --stats
gh-aura audit OTHER_USER --json --output report.json
gh-aura showcase --goal "platform engineer" --limit 4 --inspect 6
gh-aura profile --style minimal --output draft.md
gh-aura profile --style regular --language es --output perfil.md
gh-aura profile --visual 20 --output restrained.md
```

The existing `audit` command now includes a **first-minute hiring-manager review** with a target role, public bio, profile README, shortlisted projects, documentation and contact links, and explicit unknowns for code quality and personal authorship. Set `editorial.targetRole` or override it with `audit --goal "backend engineer"`. This is not an interview-probability score. See [Hiring readiness](HIRING_READINESS.md).

Pass `--deep N` (0–5) with `audit`, `showcase`, or `brief` to inspect public repository file structure for test/CI/build/architecture/example paths. This is **opt-in** (default zero); no code is executed, no test result or personal authorship is inferred, and API response budgets still apply. [Project evidence details](PROJECT_EVIDENCE.md).

Inspection adds sampled public README reads. Conventional headings are heuristic signals, not proof of code quality. Scores concern presentation evidence, not engineer quality or hiring probability. Unknown information is not a negative finding.

`--output` writes a local file; status goes to stderr so stdout stays useful for data. Existing output files require `--force`.

### Presentation language

`profile --language es` (or `config set editorial.language es`) localizes **only the deterministic template headings**, project-story labels, and related metadata labels. English is the default. User-provided biography, projects, links, and descriptions remain unchanged; no AI or translation API is invoked. `brief --language es --prompt` passes the editorial-language preference to an external writer, which remains optional. 

### Compare a local job posting

`gh-aura audit --job vacancy.txt --deep 2 --json` analyzes locally stored plain-text job requirements and maps recognized technology/domain terms to **explicitly selected public projects**. The job text is parsed before any network requests, stays on the user's machine, is never included verbatim in reports, and is not sent to GitHub or an AI model. Result states are `mentioned-in-public-metadata`, `user-claimed`, or `not-observed-in-selected-projects`; none proves skill or a hiring probability. See [job description matching](JOB_MATCH.md).

### Your project contributions

Set `profile.projectStories` with a JSON array of the projects you actually worked on. Each record can include `repo`, `problem`, `contribution`, `tradeoffs`, `outcome` and an optional HTTPS `proof` link. Stories are displayed **only** for showcased projects and are marked as user-supplied, not externally verified. See [Project stories](PROJECT_STORIES.md) for a copyable example and the minimal/regular/flashy differences.

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

## Research references (offline)

```bash
gh-aura references
gh-aura references --company Microsoft
gh-aura references --json --output references.json
```

This lists source-linked GitHub profiles from employer-controlled engineering author pages and the distinct 100-person public-affiliation cohort. **Public organization membership and a self-listed employer are not proof of employment.** Source pages can become stale. The list contains examples of presentation structure, not identities, employers or claims to copy. This command reads only packaged data and makes **zero GitHub API calls**. See [industry study](../research/INDUSTRY_STUDY.md).

Target-company preferences may guide external writing only: `gh-aura config set editorial.targetCompany "Google"`. A desired employer is not a current employer claim.

## Achievement capability planning

```bash
gh-aura achievements --plan --scope free
gh-aura achievements --badge pull-shark --plan
gh-aura achievements --scope free --private --plan --json
```

Each item now identifies its collectible/paid/program/historical class, source date, reported tiers, private-activity uncertainty, and which actions need GitHub or other people. `--plan` **never creates PRs, issues or payments**. Award status is never inferred from an API count. See [Achievement registry](ACHIEVEMENTS.md).

## Achievements

`achievements` is an offline guide with no configured account; otherwise it adds bounded public PR/star evidence. No count guarantees eligibility or ownership. `achievements.earned` is explicitly self-reported; `achievements.excluded` controls omissions; `achievements.allowPaid` defaults false. Historical, program, paid and community-reported entries remain distinguished. The tool does not award badges or manufacture private-repository interactions.

## Contribution ranges and attribution recovery

```bash
gh-aura contributions --from 2020-01-01 --to 2024-12-31
gh-aura contributions --from 2020 --to 2026 --days --json
gh-aura contributions --from 2020 --to 2026 --private --recover
gh-aura contributions --plan
```

These read-only flags extend the existing annual `contributions --year` / `--all` commands. Dates are UTC; the tool partitions the selected interval by year and batches up to four historical GraphQL collections per API request. `--days` exports daily counts exactly as GitHub reports them, never invented data. `--private` displays opt-in visibility guidance; it does not change settings or access private repository contents. `--plan` suggests conditional future, genuine repo tasks using already collected public metadata. It never schedules dates, fabricates issues, starts work or makes more API requests.\n\n`--recover` prints manual steps for legitimately missing historical attribution (author email, branches, forks, private visibility) without modifying Git history. See [Activity](ACTIVITY.md).

### Prepare meaningful achievement work

```bash
gh-aura achievements --prepare pull-shark --repo OWNER/PROJECT
gh-aura achievements --prepare pair-extraordinaire --repo OWNER/PRIVATE_REPO --private --output task.md
```

These commands only create checklists based on real public issues where visible; `--private` skips remote reads and does not unlock anything. They **never** create fake issues, empty PRs, stars, paid purchases or badge awards. See [Achievement task preparation](ACHIEVEMENT_ACTIONS.md).

## Contributions

`contributions --year YYYY` selects a year; `--all` queries annual windows from account creation. GraphQL counts require authenticated read access and reflect the token's visibility, not all professional work. Missing authentication leaves counts unknown.

`--details` adds bounded public release/attributed-commit/PR evidence: three repositories and ten recently updated merged PRs. PR dates are explicitly opening dates, not guessed merge dates. Repository creation is not project start or career level. Email attribution, branch eligibility and private-visibility settings are manual checks. No dates, authors or histories are rewritten.

## Offline local Git author attribution

`gh-aura contributions --local .` inspects actual author metadata in a local Git working tree without fetching GitHub data or using an account token. `--from` and `--to` filter by **Git author timestamp**, which is not proof of when work was completed. The default comparison uses the repository's configured `user.email`. For several historical identities use `--emails-file verified-emails.txt` containing only the local email addresses that **you** believe you have linked to GitHub. The CLI does not verify account email ownership; confirm the list in GitHub settings yourself.

The output contains only aggregate counts: matched, other, or unclassified. No author emails, commit messages, remote URLs or source are exported. It checks at most 5,000 commits, detects shallow clones and never edits Git. It does not assert whether GitHub should award any particular contribution. See [Activity documentation](ACTIVITY.md).

## API failures

401: token rejected. 403: permissions, rules or quota. 429/rate-limit: obey retry instructions. 409/422 during publication: inspect the current state and preview again. Resource-budget errors: reduce the scan or deliberately adjust the request cap. No automatic quota purchases, account rotation or background retry loops.
