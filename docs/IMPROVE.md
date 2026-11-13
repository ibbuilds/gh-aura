# Complete profile workflow

The CLI and MCP share `gh-aura-whole-profile-v1` intent and a fingerprinted `gh-aura-profile-change-plan-v1` plan. Components are optional. Node 22+, no AI provider or runtime dependencies required.

## Intent and evidence

    gh-aura improve spec --output profile.json
    gh-aura improve context USER --spec profile.json --output context.json
    gh-aura improve projects USER --goal "backend engineer" --pages 5 --inspect 3
    gh-aura improve project --repo OWNER/PROJECT
    gh-aura improve pins USER

Edit the generated JSON: `composition` holds style, language, narrative biography, sections, selected projects, links and visual preferences. `account` holds only requested sidebar fields: `bio` (160 Unicode characters), `name`, HTTPS `blog`, `company`, `location`, `hireable`. Empty strings explicitly clear fields. Unspecified fields stay untouched. A target role is not a claim of current employment.

Set `readme:false` to preserve the README or choose a profile without one. `assets` accept up to eight local payloads: safe `assets/NAME.svg|png|jpg|gif|webp`, `encoding` utf-8/base64, `content`, nonempty `alt` and `rights` user-owned/permitted-license. Each is limited to 256 KiB. No remote image is copied automatically.

Project scans return coverage and `nextCursor`. Continue with the same goal until complete, or inspect explicit public projects including organization work. READMEs and source structure are observations; files are not executed. Confirm personal contributions. Selected project order and disabled sections survive refinements. The eight style categories guide freely composable designs, including minimal profiles; no fixed winner is imposed.

## Preview, approval and execution

    gh-aura improve plan USER --spec profile.json --file draft.md --delivery pr --output plan.json
    gh-aura improve preview --review plan.json
    gh-aura improve apply --review plan.json --confirm FINGERPRINT
    gh-aura improve status --review plan.json

Omit `--file` for account/workspace-only changes. Plans bind exact bytes, previous revisions, account differences, asset rights, targets and workspace actions. New public USER/USER creation and its seed README are explicit in the preview. Default `pr` opens a review without merging; `commit` explicitly updates the default branch. README and assets share one Git commit. Account updates are independently verified steps; there is no cross-component rollback transaction.

The owner can run `improve authorize --review plan.json --confirm FINGERPRINT` to display MCP host environment settings. The owner installs **both** `GH_AURA_APPROVED_PLAN` (absolute path) and `GH_AURA_APPROVED_FINGERPRINT`. Then `gh_aura_apply_approved_profile` takes no arguments and executes only that grant. `gh_aura_approved_profile_status` reads its local progress. Remove the environment settings to revoke access. A model-generated fingerprint or plan does not constitute approval.

Resume the same grant to reconcile uncertain results. Exact remote state is checked before writing; conflicts or unreconciled outcomes stop. Closed profile PRs are not reopened. Merged PRs are read from the default branch even if the source branch was deleted. Local journals live under `~/.gh-aura/profile-executions` or owner-configured `GH_AURA_PROFILE_STATE_DIR`. Dead local PID locks recover conservatively; live/foreign locks block concurrent execution. A local journal cannot authorize adoption of a repository that appeared after planning.

`pins` is an ordered list of up to six public OWNER/REPO choices. GH Aura prepares GitHub's manual pin action and verifies the visible result on a later apply when GraphQL is available. Pending pins and unmerged PRs remain `needs-user-action`.

## One private workspace

`activity` and `badges` use the same owned, active, marked private repository, default USER/gh-aura-workspace. Existing unmarked repositories are never adopted. Legacy activity/badge commands remain supported. To initialize a workspace for collaboration, first run a separately reviewed ordinary Activity or Badges plan; then grant the second account only the required access through GitHub.

Example activity intent:

```json
{"repo":"USER/gh-aura-workspace","from":"2022-01-01","to":"2022-01-02","dailyTargets":{"2022-01-01":3,"2022-01-02":1}}
```

Planning reads the actual graph baseline, adds deficits and binds expected totals. Configure `GH_AURA_AUTHOR_NAME` and `GH_AURA_AUTHOR_EMAIL` locally; the email must belong to the authenticated account. Existing dates append distinct practice files, without rewriting history. Applying refreshes the baseline and reconciles exact already-published files. Readback distinguishes graph targets observed, delayed/hidden attribution and differing totals. Colors are GitHub's relative rendering, not a fixed color API. Other activity may change totals.

For a legacy standalone `calendar plan --daily-targets targets.json`, supply `--existing history.json` from `contributions --all --days --json` to account for existing activity. Without history, values describe additions against an unknown baseline, not guaranteed final totals.

Badge intents support `mode:events` (bounded PR/issue attempts), `mode:campaign` with `tier:base|bronze|silver|gold`, or `mode:collaboration`. Campaigns retain one reviewed maximum scope, serialize writes and pause after each tier until the actual award is visible. An unknown/missing award stops scaling; 1,024 events do not prove Gold. Historical, paid and externally controlled achievements keep their real requirements.

Collaboration example:

```json
{"repo":"USER/gh-aura-workspace","mode":"collaboration","kind":"coauthor","collaborator":"SECOND_ACCOUNT","consent":true,"content":"# Reviewed joint exercise\n\nDescribe the approved work here."}
```

Configure `GH_AURA_COLLAB_TOKEN`, `GH_AURA_COLLAB_NAME`, `GH_AURA_COLLAB_EMAIL` locally. Both tokens must authenticate as distinct reviewed accounts with access to the private workspace; the second needs write access and a verified email or matching ID-based noreply. No token or private email belongs in agent arguments. One plan stages one exact coauthored file/PR and merges that reviewed private exercise with a SHA precondition. Replays reconcile the PR and file instead of duplicating them.

Token requirements appear by identity in the plan. Coauthor: principal needs Contents/Pull requests write; secondary needs Contents read, plus Email addresses read only for a non-noreply address. Discussion-answer: **both tokens need Discussions write**. Repository collaborator write access alone does not grant token scopes. For classic tokens, private repository access requires `repo`; grant `user:email` only when needed for email verification.

For `kind:discussion-answer`, supply reviewed `question` and `answer` instead of `content`. Enable Discussions and a Q&A category first. The authorized second account asks, the owner answers, and that second account accepts the exact answer if permitted. Changed content or another chosen answer blocks replacement. These are labeled private exercises; eligibility for Pair Extraordinaire/Galaxy Brain is unverified until GitHub shows the award. Signup, consent, account access and provider-required interactions remain owner actions.

Badge exercises and workspace creation affect today's graph. Initialize the workspace and run badges before planning today's exact calendar target; a combined plan may include historical dates. Private graph visibility, GitHub processing and account age affect attribution. No third-party stars, paid sponsorship or fabricated professional history are generated.

## Research and distribution

Historical corpus and original eight references remain at the [immutable archive](../research/README.md). `sources compile --catalog reviews.json --output patterns.json` accepts at least 500 complete, source-linked editorial reviews with coverage of all eight styles. `GH_AURA_PATTERNS_FILE` selects the compiled library locally. The default has no fabricated approvals. `sources library` shows its state.

Skill installation supports Codex (`~/.agents/skills`), Claude (`~/.claude/skills`) and explicit generic destinations. Local edits are preserved; replacing them requires `--force --directory PATH`. MCP and a portable writing prompt serve other clients. Publishing a GitHub repository alone does not guarantee discovery by every AI.

[CLI](CLI.md) · [Security](../SECURITY.md) · [Acceptance](RELEASE_READINESS.md)
