# Security

Only two explicitly reviewed CLI operations can write to GitHub: `apply` for the user's public `USER/USER` profile README (directly or via an unmerged PR), and `work apply` for **one user-authored Markdown file** (`README.md` or `docs/**/*.md`) in an explicitly named, authorized repository. `work apply` creates an unmerged PR only. Neither operation changes account settings, pins, badges, or Git history.

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

In PR mode, partial failures may leave a branch. The CLI never overwrites a conflicting review branch and never merges, deletes branches or weakens protections automatically.
