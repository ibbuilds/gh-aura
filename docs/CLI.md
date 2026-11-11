# Command reference

## Account and configuration

`gh-aura init USER` writes `.gh-aura.json` in the current directory. It never changes GitHub. Pass `--config FILE` for a separate configuration; `--force` allows replacing an existing local file.

```bash
gh-aura config show
gh-aura config get profile.style
gh-aura config set profile.style regular
gh-aura config set profile.headline "Backend systems and developer tools"
gh-aura config set profile.sections.technologies false
gh-aura config set profile.maxProjects 0
gh-aura config set profile.technologies '["TypeScript","Python"]'
gh-aura config reset profile.sections.technologies
gh-aura config set showcase.weights.popularity 5 --dry-run
```

Use JSON values for arrays, booleans and numbers; quote text containing spaces. Unknown keys and invalid values fail without saving. Resetting a section restores the selected style's default. Local configuration contains preferences, never credentials.

Settings are grouped under `user`, `scan`, `profile`, `showcase` and `achievements`. `config show` is the complete reference for supported keys. `scan.maxRepos` is 1–500; `scan.inspectRepos` is 0–20; `profile.maxProjects` is 0–6. Lists of explicit featured repositories are not padded; exclusions take precedence.

## Inspect and draft

```bash
gh-aura audit --inspect 6
gh-aura audit OTHER_USER --json --output report.json
gh-aura showcase --goal "platform engineer" --limit 4 --inspect 6
gh-aura profile --style minimal --output draft.md
gh-aura profile --style regular --output regular.md
gh-aura profile --style flashy --output flashy.md
```

Inspection fetches additional public README files. English setup/usage headings are heuristic signals; unfamiliar headings are not proof of missing documentation. Metadata-based scores describe presentation suitability, not engineer quality. Unknown information is not a negative finding.

`--output` writes a local file and sends the confirmation to stderr, keeping stdout useful in pipelines. Existing files require `--force`. That flag never forces a GitHub update. Commands reject irrelevant options rather than silently ignoring them.

### Preserve existing content

`gh-aura profile --keep --output draft.md` keeps your current README and manages only the region between `<!-- gh-aura:start -->` and `<!-- gh-aura:end -->`. On first use it appends a managed region, preserving all original text. Edit the draft to remove any duplicated introduction, then preview it. Later runs replace only that one region. Ambiguous/multiple markers fail rather than deleting text.

### Avoid unnecessary requests

Analysis commands reuse public reads for five minutes. `--fresh` bypasses disk caching for one invocation. `GH_AURA_NO_CACHE=1` disables it for a shell session. `GH_AURA_CACHE_DIR` selects a cache location; otherwise the operating-system/user cache directory is used. Cache files are bounded, credential-isolated and contain no tokens. Reports announce reused data on stderr. Publication never uses cached state. See [limits and free operation](FREE.md).

## Review and publish

```bash
gh-aura preview --file draft.md --save review.json
# Read the diff. Publish only when it matches your intention.
gh-aura apply --review review.json
```

The public `USER/USER` repository must already exist. `preview` reads its root `README.md` on the current default branch. An absent README may be created, but GH Aura never silently creates a repository.

The review file records the account, branch, file revision, exact draft path and SHA-256 digest. It contains no token. If either the draft or remote state changes, run preview again. Reviews are local to the draft path; do not accept a review file from an untrusted source.

Alternatively, use the digest printed by preview:

```bash
gh-aura apply USER --file draft.md --approve YOUR_REVIEW_CODE
```

Supply `GH_TOKEN` or `GITHUB_TOKEN` securely through your shell session or secret manager. Limit write access to the profile repository. Never paste tokens into config, README files, AI conversations or public issues.

`apply` commits only the root profile README. GitHub branch rules still apply; the tool does not bypass protected branches. Re-previewing an unchanged draft results in a no-op. A previously used review becomes stale after a change. `apply --dry-run` refuses to publish; use `preview` instead.

The preview limit is 600 lines and drafts must be UTF-8, at most 256 KiB, with no terminal control characters. The limit prevents publishing from an incomplete review. Diffs are for inspection, not patches intended for `git apply`.

### Open a PR instead

```bash
gh-aura apply --review review.json --pr
```

Requires **Contents: read and write** plus **Pull requests: read and write** on the profile repository. GH Aura creates one deterministic review branch, writes only `README.md` there, and opens a PR against the reviewed default branch. It never merges or force-pushes. Re-running an unchanged request reuses an already-open matching PR. A conflicting branch is not overwritten; inspect it manually. Repository protections still apply.

A failure can leave a review branch without a PR. The CLI reports the branch; inspect it before retrying or deleting it. Network writes are never retried automatically.

### Recover or undo

A failed network response during publishing may mean the commit succeeded. Inspect the remote README or run preview before retrying; writes are never retried automatically. Successful publishing returns a commit URL. To undo, restore the previous README from GitHub history into a local draft, preview it, and apply that reviewed restoration. No force-push or history rewrite is needed.

## Achievements

```bash
gh-aura achievements
gh-aura achievements USER --json
gh-aura config set achievements.earned '["pull-shark"]'
gh-aura config set achievements.excluded '["quickdraw","yolo"]'
gh-aura config set achievements.allowPaid false
```

Without a configured or explicit account, the guide is offline. With an account, the CLI adds public merged-PR and repository-star evidence. Counts do not establish badge eligibility. `earned` is explicitly self-reported, not verified by GitHub. Historical, paid, program-dependent and community-reported entries are identified. Community rules can be incomplete or outdated; consult each source. Paid opportunities are disabled by preference by default and no payments are initiated.

## Contributions and timeline

```bash
gh-aura contributions
gh-aura contributions --year 2024
gh-aura contributions --all --json --output history.json
gh-aura contributions --details
```

Requires a GitHub token for annual GraphQL counts. The default is the current UTC year; `--all` makes one query per year from account creation. Results reflect what GitHub exposes to that token, not all professional work ever performed. Without authentication, the report leaves counts unknown and provides a visibility checklist instead.

Email attribution, eligible branches and private-contribution settings are manual checks; the CLI does not inspect local commit email inventories or change account settings. A separate timeline lists account creation and at most 12 earliest repository-creation dates from the scanned public inventory. Those dates are not project start dates or proof of career level. `--details` adds at most three public repositories' recent releases and latest attributed commit, plus ten recently updated merged PRs. PR dates are explicitly the opening dates, not guessed merge dates. The sample is not a complete work history. Extra API calls and fresh visibility checks are bounded; public responses can be cached.

## External editors and AI

`gh-aura brief --output brief.json` exports public evidence, the existing public README and your chosen presentation. Give it to your preferred editor, save their proposal as `draft.md`, and use the same preview/apply flow. GH Aura does not invoke an AI provider or send credentials. See [AI workflow](AI_WORKFLOW.md).

## Compatibility and errors

`plan` remains an alias for `audit`; `diff` compares the template-generated README without approving publication. `-h`, `-V` and `-o` are aliases for help, version and output. Exit status 0 means success, 1 means an error. JSON is available for structured reports and apply results; `profile` produces Markdown and `brief` always produces JSON.

A 401 means the token was rejected; a 403 can indicate permissions, repository rules or rate limits. Respect retry guidance after 429/rate-limit responses. A 409/422 during publishing requires another preview and review of the current remote state.
