# Complete profile workflow

The CLI and MCP share `gh-aura-whole-profile-v1` intent and a fingerprinted `gh-aura-profile-change-plan-v1` plan. Components are optional. Node 22+, no AI provider or runtime dependencies required.

## Intent and evidence

    gh-aura improve spec --output profile.json
    gh-aura improve draft USER --spec profile.json --output draft.md
    gh-aura improve context USER --spec profile.json --output context.json
    gh-aura improve projects USER --goal "backend engineer" --pages 5 --inspect 3
    gh-aura improve project --repo OWNER/PROJECT
    gh-aura improve pins USER

Edit the generated JSON: `composition` holds style, language, narrative biography, sections, selected projects, links and visual preferences. `account` holds only requested sidebar fields: `bio` (160 Unicode characters), `name`, HTTPS `blog`, `company`, `location`, `hireable`. Empty strings explicitly clear fields. Unspecified fields stay untouched. A target role is not a claim of current employment.

`readme USER --spec profile.json`, `brief USER --spec profile.json` and `diff USER --spec profile.json` use the same composition projection as `improve draft`. They accept either the shared whole-profile spec or a legacy composition spec. Edit presentation flags inside that file when using `--spec`. The native renderer honors projects/order, sections, contact choices, language and third-party opt-in; custom art direction and narrative voice are written by the chosen AI or owner, not invented by deterministic code.

Original [before/after composition examples](../examples/README.md) cover learning, engineering, project-led, research and visual goals. They are authored demonstrations, not real candidate evaluations or approved winners from the research corpus.

Set `readme:false` to preserve the README or choose a profile without one. `assets` accept up to eight local payloads: safe `assets/NAME.svg|png|jpg|gif|webp`, `encoding` utf-8/base64, `content`, nonempty `alt` and `rights` user-owned/permitted-license. Each is limited to 256 KiB. No remote image is copied automatically.

Project scans return coverage and `nextCursor`. Continue with the same goal until complete, or inspect explicit public projects including organization work. READMEs and source structure are observations; files are not executed. Confirm personal contributions. Selected project order and disabled sections survive refinements. The eight style categories guide freely composable designs, including minimal profiles; no fixed winner is imposed.

## Preview, approval and execution

    gh-aura improve check USER --spec profile.json --file draft.md --resources
    gh-aura check --spec profile.json --file draft.md --strict --json

    gh-aura improve plan USER --spec profile.json --file draft.md --delivery pr --output plan.json
    gh-aura improve preview --review plan.json
    gh-aura improve apply --review plan.json --confirm FINGERPRINT
    gh-aura improve status --review plan.json

Omit `--file` for account/workspace-only changes. Plans bind exact bytes, previous revisions, account differences, asset rights, targets and workspace actions. New public USER/USER creation and its seed README are explicit in the preview. Default `pr` opens a review without merging; `commit` explicitly updates the default branch. README and assets share one Git commit. Account updates are independently verified steps; there is no cross-component rollback transaction.

An already-created empty public profile repository is supported too. The plan binds its repository ID and branch, shows `initializeRepository` and the exact seed, then publishes the reviewed README/assets. Missing default branches with other branches/tags are not treated as empty. Initialization creates a file without a replacement SHA, verifies a root commit containing only that seed, and reconciles a lost response from remote evidence. New history or a replaced repository stops publication; no force update or cleanup is performed.

New plans also bind composition requirements and reject missing selected project/contact links, unresolved placeholders and unsafe links/images before publication planning. Comments and code snippets cannot satisfy selected visible evidence. Disabled conventional sections produce review findings without imposing a fixed heading structure. These checks cannot prove factual accuracy or complete semantic agreement with a freeform design brief.

`--resources` on `improve check` or `improve plan` opts into bounded anonymous HTTPS metadata checks. Relative paths resolve against the public profile repository revision; assets included in the plan are recognized locally. Checks detect unavailable responses and image endpoints serving HTML. DNS addresses are pinned, private/local destinations and credential-bearing URLs are blocked, redirects are revalidated, and no GitHub token or response body is forwarded/retained. Maximums are 24 targets by default (32 explicitly in the library), 48 requests and 12 seconds overall. Unknown results remain review findings. HTTP metadata does not establish image decoding, license rights, fragment validity or actual GitHub light/dark rendering.

MCP exposes `gh_aura_profile_native_draft`, `gh_aura_profile_validate` and `gh_aura_profile_resources_check`; these do not publish or authorize anything. Opt-in resource findings accompany the reviewed plan. Legacy plans without composition metadata remain readable.

The owner can run `improve authorize --review plan.json --confirm FINGERPRINT` to display MCP host environment settings. The owner installs **both** `GH_AURA_APPROVED_PLAN` (absolute path) and `GH_AURA_APPROVED_FINGERPRINT`. Then `gh_aura_apply_approved_profile` takes no arguments and executes only that grant. `gh_aura_approved_profile_status` reads its local progress. Remove the environment settings to revoke access. A model-generated fingerprint or plan does not constitute approval.

Resume the same grant to reconcile uncertain results. Exact remote state is checked before writing; conflicts or unreconciled outcomes stop. Closed profile PRs are not reopened. Merged PRs are read from the default branch even if the source branch was deleted. Local journals live under `~/.gh-aura/profile-executions` or owner-configured `GH_AURA_PROFILE_STATE_DIR`. Dead local PID locks recover conservatively. Whole-profile plans for the same account share a writer lock in that directory, including plans with different fingerprints. Use one coordinator for an account; separate machines/state directories and legacy standalone commands do not share this local lock. A local journal cannot authorize adoption of a repository that appeared after planning.

`pins` is an ordered list of up to six public OWNER/REPO choices. GH Aura prepares GitHub's manual pin action and verifies the visible result on a later apply when GraphQL is available. Pending pins and unmerged PRs remain `needs-user-action`.

## One private workspace

`activity` and `badges` use the same owned, active, marked private repository, default USER/gh-aura-workspace. Existing unmarked repositories are never adopted. Legacy activity/badge commands remain supported. To initialize a workspace for collaboration, first run a separately reviewed ordinary Activity or Badges plan; then grant the second account only the required access through GitHub.

Example activity intent:

```json
{"repo":"USER/gh-aura-workspace","from":"2022-01-01","to":"2022-01-02","dailyTargets":{"2022-01-01":3,"2022-01-02":1}}
```

Planning reads the actual graph baseline, adds deficits and binds expected totals. Configure `GH_AURA_AUTHOR_NAME` and `GH_AURA_AUTHOR_EMAIL` locally; the email must belong to the authenticated account. Existing dates append distinct practice files, without rewriting history. Applying refreshes the baseline and reconciles exact already-published files. Readback distinguishes graph targets observed, delayed/hidden attribution and differing totals. Colors are GitHub's relative rendering, not a fixed color API. Other activity may change totals.

New calendar plans retain the supplied daily baseline. `activity preview --review calendar.json --year 2022 --svg --output preview.svg` shows before/projected values; omit `--svg` for JSON. Select one year for a multi-year plan. `gh_aura_activity_preview` exposes the same read-only comparison to an agent. Unknown cells are hatched and never inferred as zero. The graphic is original illustrative output, not a screenshot of GitHub or a prediction of its exact colors.

For a legacy standalone `calendar plan --daily-targets targets.json`, supply `--existing history.json` from `contributions --all --days --json` to account for existing activity. Without history, values describe additions against an unknown baseline, not guaranteed final totals.

Badge intents support `mode:events` (bounded PR/issue attempts), `mode:campaign` with `tier:base|bronze|silver|gold`, or `mode:collaboration`. Campaigns retain one reviewed maximum scope, serialize writes and pause after each tier until the actual award is visible. An unknown/missing award stops scaling; 1,024 events do not prove Gold. Historical, paid and externally controlled achievements keep their real requirements.

Collaboration example:

```json
{"repo":"USER/gh-aura-workspace","mode":"collaboration","kind":"coauthor","collaborator":"SECOND_ACCOUNT","consent":true,"content":"# Reviewed joint exercise\n\nDescribe the approved work here."}
```

Configure `GH_AURA_COLLAB_TOKEN`, `GH_AURA_COLLAB_NAME`, `GH_AURA_COLLAB_EMAIL` locally. Both tokens must authenticate as distinct reviewed accounts with access to the private workspace; the second needs write access and a verified email or matching ID-based noreply. No token or private email belongs in agent arguments. One plan stages one exact coauthored file/PR and merges that reviewed private exercise with a SHA precondition. Replays reconcile the PR and file instead of duplicating them.

Token requirements appear by identity in the plan. Coauthor: principal needs Contents/Pull requests write; secondary needs Contents read, plus Email addresses read only for a non-noreply address. Discussion-answer: **both tokens need Discussions write**. Repository collaborator write access alone does not grant token scopes. For classic tokens, private repository access requires `repo`; grant `user:email` only when needed for email verification.

For `kind:discussion-answer`, supply reviewed `question` and `answer` instead of `content`. Enable Discussions and a Q&A category first. The authorized second account asks, the owner answers, and that second account accepts the exact answer if permitted. Changed content or another chosen answer blocks replacement. These are labeled private exercises; eligibility for Pair Extraordinaire/Galaxy Brain is unverified until GitHub shows the award. Signup, consent, account access and provider-required interactions remain owner actions.

For multiple exact exercises under one authorization, use `mode:collaboration-campaign` and `exercises` instead of the top-level content/question/answer. CLI `improve plan` and MCP share this intent; `gh_aura_badges_collaboration_campaign` also previews it offline. Example Galaxy Brain base intent:

```json
{"repo":"USER/gh-aura-workspace","mode":"collaboration-campaign","kind":"discussion-answer","collaborator":"SECOND_ACCOUNT","consent":true,"tier":"base","exercises":[{"question":"How does this private exercise handle UTC dates?","answer":"Dates and synthetic additions are explicitly labeled."},{"question":"What does retry verify in this private exercise?","answer":"The exact remote marker and answer are read before another write."}]}
```

Supply distinct exact content for every reviewed exercise. Source-reported targets are Pair **1/10/24/48**, Galaxy **2/8/16/32** for base/bronze/silver/gold. The campaign stops at each milestone until that actual award/tier is visible; it also stops if its per-account write reservations are exhausted. One approved scope survives normal resumption and reconciles uncertain remote results. The local journal and shared hourly ledger bound this coordinator; they are not GitHub's global quota. Changing content, accounts, target or budget requires a new owner review. These simulated private routes have not earned verified awards in a live pilot.

Badge exercises and workspace creation affect today's graph. Initialize the workspace and run badges before planning today's exact calendar target; a combined plan may include historical dates. Private graph visibility, GitHub processing and account age affect attribution. No third-party stars, paid sponsorship or fabricated professional history are generated.

## Research and distribution

Historical corpus and original eight references remain at the [immutable archive](../research/README.md). `sources compile --catalog reviews.json --output patterns.json` accepts at least 500 complete, source-linked editorial reviews with coverage of all eight styles. `GH_AURA_PATTERNS_FILE` selects the compiled library locally. The default has no fabricated approvals. `sources library` shows its state.

Skill installation supports Codex (`~/.agents/skills`), Claude (`~/.claude/skills`) and explicit generic destinations. Local edits are preserved; replacing them requires `--force --directory PATH`. MCP and a portable writing prompt serve other clients. Publishing a GitHub repository alone does not guarantee discovery by every AI.

`npm run benchmark` measures the complete context and native draft against a deterministic public fixture. The current fixture uses 8 context requests versus 11 for the earlier duplicated sequence; a native draft uses 2. Actual response sizes are reported. This is not a universal latency or model-token saving claim.

[CLI](CLI.md) · [Security](../SECURITY.md) · [Acceptance](RELEASE_READINESS.md)
