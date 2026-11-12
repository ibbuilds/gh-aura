# Security

Four explicitly reviewed CLI operations can write to GitHub: `apply` for the user's public `USER/USER` profile README (directly or via an unmerged PR), `work apply` for one user-authored Markdown file through an unmerged PR, `activity apply` for a marked owned private practice workspace (legacy `calendar apply` accepted), and `badge-run apply` for an owned, marked private sandbox. Existing repository history and account settings are never rewritten.

## Credentials

Public audits can run without authentication. Contribution counts require authenticated reads. Publishing requires a token with **Contents: read and write**, restricted to the intended repository. Opening a PR (via `apply --pr` or `work apply`) additionally needs Pull requests write access. For private documentation work, `work preview --private` is an explicit opt-in and never uses the public cache. Supply `GH_TOKEN` or `GITHUB_TOKEN` through a trusted shell session or secret manager; never commit it, store it in configuration or paste it into an AI brief.

Requests are restricted to the GitHub API origin and reject redirects. Public-profile exports do not read private repository content even when the token could access it. External AI is optional and not invoked by the tool.

## Review boundary

`preview` compares the exact draft with the current root README and produces a digest. A local review file is a convenience, not an authentication mechanism or proof that a human read the diff. It binds account, repository, branch, path, remote revision/content and exact draft bytes. Treat review files as trusted local instructions; never apply one from an untrusted source.

`apply` re-reads the target, recomputes the digest and supplies the branch and current SHA to GitHub. Stale reviews are rejected. Re-previewing identical content gives a no-op. Drafts are bounded to 256 KiB and reviews to 600 lines; truncated or control-character-bearing content cannot receive approval.

Writes are never retried automatically. A network failure can leave the result unknown; inspect GitHub or preview again before retrying. Branch protection still applies and is not bypassed. Restore earlier README content through a new reviewed commit rather than rewriting history.

## Reviewed documentation PR safety

`work preview` reads the chosen repository and Markdown file live, validates its path and privacy, and shows the complete diff. It can save a minimal, private local review record without tokens or full document text. `work apply` revalidates the latest remote branch/file and exact digest, then creates or reuses a deterministic review branch and opens **only an unmerged PR** if exactly one approved Markdown document differs. Unexpected branch files, stale revisions or changed drafts abort. Incomplete/uncertain network writes require manual inspection; no automatic retry, force-push, merge or bypass of branch protections. See [work review documentation](docs/WORK.md).

## Untrusted text

Repository metadata is data, not executable instructions. Rendering escapes metadata and validates links. User-authored extra Markdown and AI-written drafts still need human review. Flashy templates use external Shields.io technology images; they are not GitHub-awarded achievements.

## Reporting

Do not publish credentials, private data or exploitable details in public issues. Use GitHub private vulnerability reporting when available, or request a private contact channel without disclosing sensitive details.

## Local public-read cache

The CLI caches explicitly public GET responses for five minutes; credential-derived keys isolate different sessions without storing the credential. Files use restrictive permissions where supported. It never caches GraphQL, write requests or errors. Token-bearing live content reads recheck public repository visibility before exporting new contents. Previously public cached observations may be up to five minutes old; use `--fresh` to recheck, or `GH_AURA_NO_CACHE=1` to disable the cache.

Profile preview/direct publication, documentation work preview and both PR publishing paths bypass all cached state. Corrupt or unwritable cache files fall back to normal online requests, not stale authorization. Cache files are not credentials or approval artifacts.

In the ordinary profile or `work` PR mode, partial failures may leave a branch. Those workflows never merge a PR, overwrite a conflicting review branch, delete branches or weaken protections. The separate explicitly approved `badge-run apply` is allowed to merge **only** generated exercises in an owned marked private sandbox, and GitHub enforces existing branch protections. New plans bind catalog version, operations, exclusions, target tier and budget to a SHA-256 fingerprint; older validated plans still load. `badges auto status` and `badges auto next` use read-only remote access, never confirm an award, and fail closed on incomplete or inconsistent workspace history. `badges auto next --goal max` chooses stages 2, 16, 128 and 1,024 from verified local events; it is not proof of GitHub badge eligibility. `next` writes only a locally approved plan after checking no interrupted exercise branches.

## Private badge sandbox

`badge-run plan` / `badges auto` plans offline. `badge-run apply` requires an approved fingerprint and only creates or uses a **private, owned GH Aura-marked sandbox repository**. It can open and merge exercise PRs and close a QA issue. Existing unmarked repos, public repos, other users' repos and unexpected branches are rejected. No force-push, bypass of branch protection, public automation, third-party action or hidden scheduling. An interrupted run may leave partial private state; inspect it before retrying. Individual mutative requests are paced serially at least 1 second apart in one apply. A local atomic, per-account rolling hourly budget reserves no more than 480 content writes within 60 minutes across GH Aura CLI processes sharing the same home directory, leaving limited headroom below GitHub's general 500/hour secondary guideline. This **does not include** GitHub web or other apps/machines and is not proof of effective allowance; the CLI never automatically retries writes after 403/429 or uncertain responses. Each PR merge is bound to the exact SHA from its generated file commit, and submitted reviews are checked before any unreviewed self-merge. The local budget ledger lives at `~/.cache/gh-aura/badge-write-budget/<hashed-user>.json` with restrictive filesystem permissions where supported. It stores only write timestamps, not tokens, emails, repository names or commit content. Concurrent reservations are serialized by an exclusive directory lock, and malformed or future-dated ledgers fail closed. A failed or uncertain mutation still consumes a local reservation; Quickdraw's issue-open and issue-close operations reserve two slots atomically before creating an issue. Issue replay checks paginate through a bounded history and stop if completeness cannot be established. Generated PR exercise indices cannot exceed 1,024 and remain capped at sixteen per approved batch. GitHub can deny badge awards for sandbox/self-created events. See [badge sandbox guide](docs/BADGE_RUN.md).

## Activity: reviewed synthetic private history

`activity plan` is offline and produces a SHA-256-bound date blueprint. `activity apply` requires explicit fingerprint approval, a new or previously marked private workspace owned by the authenticated account and a supplied GitHub-linked author email. It prepares deterministic Git history locally, then makes one Git push. For a marked existing workspace, it checks tree collisions and the exact default-branch SHA, then appends commits without force. It refuses unmarked or non-owned repositories. Tokens are not persisted to Git arguments or config. Synthetic commits are not independently verified historical professional work and GitHub may not count them. See [Activity workspace](docs/CALENDAR.md).
