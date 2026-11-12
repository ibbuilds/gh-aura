# GH Aura CLI reference

GH Aura runs locally on **Node.js 22+** with no runtime dependencies. Its commands never run in the background. A GitHub token is optional for public reads and required for authenticated history or explicitly approved writes.

## Start

```bash
gh-aura init USERNAME
gh-aura audit --inspect 3
gh-aura readme minimal --output draft.md
```

`gh-aura COMMAND --help` displays that command's accepted options.

## Four everyday commands

| Command | Purpose |
| --- | --- |
| `gh-aura activity 2022` | Read actual contribution activity for one year |
| `gh-aura activity 2020..2024` | Read eligible contribution history in a year range |
| `gh-aura badges free` | Show no-cost, potentially attainable achievements |
| `gh-aura badges pull-shark` | Show evidence and limitations for one achievement |
| `gh-aura readme minimal` | Generate a restrained README draft |
| `gh-aura readme regular` | Generate a project-focused README draft |
| `gh-aura readme flashy` | Generate a more decorative README draft |
| `gh-aura readme 80` | Choose visual intensity (0–100) |
| `gh-aura pins --goal "backend engineer"` | Recommend relevant public projects to feature |

These shortcuts read or draft locally. Only explicit `activity apply`, `badges auto apply`, `apply` and `work apply` may write remotely after reviewing an exact plan or diff.

## Activity: read, plan, and apply private practice

```bash
gh-aura activity plan 2022 --density 75 --output plan.json
gh-aura activity plan --from 2020 --to 2025 --density 75 --growth 65 --weekends 20 --output years.json
# After reviewing the exact plan and SHA-256 fingerprint:
gh-aura activity apply --review plan.json --repo OWNER/NEW_PRIVATE_REPO --author-name NAME --author-email VERIFIED_EMAIL --confirm FINGERPRINT
```

Planning is completely offline. The first approved apply creates a marked, owned private workspace; later activity and badge runs reuse it, with collision checks and non-force fast-forward pushes. The legacy `calendar` alias remains supported. Generated practice is synthetic and GitHub controls what counts. See [Activity workspace](CALENDAR.md).

## Activity and achievements

```bash
gh-aura contributions --all --days
gh-aura contributions --from 2020 --to 2024 --private --recover
gh-aura contributions --local . --emails-file known-emails.txt
gh-aura contributions --plan

gh-aura achievements --scope free --plan
gh-aura achievements --badge pair-extraordinaire --plan
gh-aura achievements --prepare pull-shark --repo OWNER/REPO
```

Real annual activity requires authenticated GraphQL reads. The `--local` mode inspects *your selected local Git history* without sending emails, source code or commit messages to GitHub. `--recover` describes eligible attribution corrections; `--plan` suggests conditional work, not scheduled commits. `--prepare` proposes tasks; it **does not award badges**.

Details: [Activity](ACTIVITY.md) · [Achievements](ACHIEVEMENTS.md) · [Genuine task preparation](ACHIEVEMENT_ACTIONS.md).

## Private badge automation (explicit)

```bash
gh-aura badges auto --tier base --strategy git-batch --output base.json
gh-aura badges auto --tier bronze --output bronze.json
gh-aura badges auto next --goal max --output next.json
# Review the exact plan and fingerprint before any write:
gh-aura badges auto apply --review bronze.json --confirm FINGERPRINT
# Inspect actual repo PR/issue events, without claiming a GitHub award:
gh-aura badges auto status
```

GH Aura creates or reuses one owned, marked private workspace (default `USER/gh-aura-workspace` after `init USER`). `badges auto next --goal max` plans the next safe milestone (2, 16, 128, 1,024). Each reviewed batch allows up to 16 PRs. The **opt-in** `--strategy git-batch` prepares those source branches using one atomic create-only Git push and then opens/merges actual PRs separately. Old approved v1/v2 REST plans remain unchanged; new Git-batch plans use a fingerprint-bound v3 format. GitHub's actual quotas and achievement eligibility still apply. [Runner guide](BADGE_RUN.md) · [Atomic Git batches](BADGE_FAST.md).

## Audit, project relevance and evidence

```bash
gh-aura audit --goal "Platform engineer" --inspect 3 --deep 2
gh-aura audit --deep 2 --checks --stats
gh-aura audit --job vacancy.txt --json --output report.json
gh-aura showcase --goal "Backend engineer" --limit 4 --deep 2
```

`--inspect N` checks up to N selected public project READMEs (0–20). `--deep N` inspects up to five selected public project Git trees for test, CI and documentation *filenames*; it does not run code. `--checks` is optional and requires `--deep`; it adds GitHub Actions run/release observations at additional API cost. A passing older run is not proof of current code quality.

A local `--job vacancy.txt` file is parsed before any GitHub request. Its text stays local; keyword overlap is not proof of skill. Details: [Project evidence](PROJECT_EVIDENCE.md) · [Job matching](JOB_MATCH.md) · [Hiring review](HIRING_READINESS.md).

## Profile generation and user-defined stories

```bash
gh-aura config show
gh-aura config set profile.style minimal
gh-aura config set profile.sections.stats false --dry-run
gh-aura config set profile.featured '["OWNER/project"]'
gh-aura config set editorial.language es
gh-aura config reset profile.sections.stats

gh-aura story set OWNER/project --contribution "What I built" --proof https://github.com/OWNER/project
gh-aura story list
gh-aura story remove OWNER/project --dry-run

gh-aura profile --style regular --language es --keep --output draft.md
gh-aura brief --prompt --output writer.txt
gh-aura check --file draft.md --strict
```

`minimal`, `regular` and `flashy` are independent style presets; `--visual 0..100` controls presentation intensity. `--keep` preserves content outside a managed README region. `story` changes *local* configuration only; these are user-supplied claims, not verified ownership. `brief --prompt` prepares vendor-neutral writing instructions without calling an AI service.

Details: [Project stories](PROJECT_STORIES.md) · [Optional AI workflow](AI_WORKFLOW.md).

## Review and publishing

```bash
gh-aura preview --file draft.md --save review.json
# Review the full diff; the file and remote revision are bound to the approval.
gh-aura apply --review review.json --pr
```

`apply --pr` creates an **unmerged** PR for the user's public profile README. Without `--pr`, it commits the exact reviewed change. Both require a scoped token with Contents write; PR mode also needs Pull requests write. Neither operation weakens branch protections.

To submit a **user-authored documentation improvement** in an authorized repository:

```bash
gh-aura work preview --repo OWNER/REPO --path docs/setup.md --file improved.md --save work.json
gh-aura work apply --review work.json
```

`work apply` opens only an unmerged PR changing one root README or `docs/*.md` file. For explicitly authorized private work, pass `--private` to the preview. No PR is guaranteed to be merged or to earn an achievement. Details: [Reviewed work PRs](WORK.md) · [Security](../SECURITY.md).

## Resource controls

Public reads use a five-minute cache and ETag revalidation. `--fresh` bypasses the cache; `--budget N` limits HTTP requests; `--stats` reports usage. Draft creation does not need to fetch the existing profile README; preview/publishing always read live state. [Free operation](FREE.md) · [Performance notes](PERFORMANCE.md).

**GitHub controls contribution counting, achievements and pins.** Generated dated practice is synthetic, not proof of past professional work. No command guarantees a badge or silently writes to a repository.
