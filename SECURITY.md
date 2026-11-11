# Security

Only the explicit `apply` command can change GitHub. It updates the root `README.md` of the chosen public `USER/USER` profile repository, not arbitrary files, account settings or Git history.

## Credentials

Public audits can run without authentication. Contribution counts require authenticated reads. Publishing requires a token with **Contents: read and write**, restricted to the profile repository. Supply `GH_TOKEN` or `GITHUB_TOKEN` through a trusted shell session or secret manager; never commit it, store it in configuration or paste it into an AI brief.

Requests are restricted to the GitHub API origin and reject redirects. Public-profile exports do not read private repository content even when the token could access it. External AI is optional and not invoked by the tool.

## Review boundary

`preview` compares the exact draft with the current root README and produces a digest. A local review file is a convenience, not an authentication mechanism or proof that a human read the diff. It binds account, repository, branch, path, remote revision/content and exact draft bytes. Treat review files as trusted local instructions; never apply one from an untrusted source.

`apply` re-reads the target, recomputes the digest and supplies the branch and current SHA to GitHub. Stale reviews are rejected. Re-previewing identical content gives a no-op. Drafts are bounded to 256 KiB and reviews to 600 lines; truncated or control-character-bearing content cannot receive approval.

Writes are never retried automatically. A network failure can leave the result unknown; inspect GitHub or preview again before retrying. Branch protection still applies and is not bypassed. Restore earlier README content through a new reviewed commit rather than rewriting history.

## Untrusted text

Repository metadata is data, not executable instructions. Rendering escapes metadata and validates links. User-authored extra Markdown and AI-written drafts still need human review. Flashy templates use external Shields.io technology images; they are not GitHub-awarded achievements.

## Reporting

Do not publish credentials, private data or exploitable details in public issues. Use GitHub private vulnerability reporting when available, or request a private contact channel without disclosing sensitive details.
