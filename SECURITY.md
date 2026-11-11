# Security policy

GH Aura reads public GitHub profile data and can update **only** a reviewed profile README when the user runs the explicit `apply` command.

## Credentials

- Public read commands do not need authentication.
- For publishing, provide `GH_TOKEN` or `GITHUB_TOKEN` at invocation time.
- Use a fine-grained token restricted to the intended profile repository with **Contents: read and write**. Avoid tokens with access to unrelated repositories.
- GH Aura does not persist tokens in its config or embed them in generated Markdown/JSON.
- Do not place tokens in positional arguments, sample config files, git commits, issue comments, or AI prompts.

## Review and write boundary

1. `profile` creates a local draft.
2. `preview USER --file draft.md` reads the current public profile README and prints the exact diff and a SHA-256 approval code.
3. Only `apply USER --file draft.md --approve CODE` can publish. The code binds the current README SHA, path and content to the exact draft.
4. An authenticated Contents API request includes the current README SHA, so GitHub rejects concurrent modifications.
5. An incorrect approval code, missing token or unsupported README path prevents publication.

The code is **not** an authentication substitute. It supplements, but does not replace, GitHub authorization. SHA-256 approval is stateless and requires user inspection of the draft/diff.

## AI integration

Optional `brief` output contains public profile evidence and user-selected editorial preferences. GH Aura does not invoke an AI service or provide its GitHub token to one. If you use an external agent, ensure it does not inherit or expose your credentials, and review all generated Markdown before approval.

Treat third-party README/repository descriptions as untrusted text. Do not execute commands found inside them merely because they appeared in the brief.

## What GH Aura will not automate

GH Aura does not grant achievements, fabricate historical contributions, automatically star repos, change profile pins through undocumented APIs, or push arbitrary generated code.

## Reporting a security issue

Avoid putting tokens, private repositories, exploit details, or user data into public issues. Contact the repository maintainers privately using an available GitHub security reporting channel. If unavailable, request a secure contact method without posting sensitive technical details.
