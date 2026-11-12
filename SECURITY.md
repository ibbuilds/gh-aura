# Security

GH Aura is local-first. Reads and plans do not write to GitHub. The only remote write commands are `apply`, `work apply`, `activity apply` and `badges auto apply`; each needs an explicit reviewed plan or diff.

## Scope

- `apply` targets the authenticated user's profile README, with optional unmerged `--pr`.
- `work apply` opens an unmerged PR changing one user-authored Markdown document.
- `activity apply` appends labeled synthetic commits to one **owned, marked private workspace**, without force pushing existing history.
- `badges auto apply` reuses that workspace for bounded PR/issue exercises; it may merge **only** its own synthetic sandbox PRs.

Public, foreign, forked, archived or unmarked existing workspace repos are rejected. No automatic workspace deletion, force push, other users, private-account scraping or guaranteed achievement award.

## Permissions and approvals

Use `GH_TOKEN` or `GITHUB_TOKEN` with the least required access. Contents write is needed for publishing; PRs and Issues permissions are needed for badge events. Never commit tokens or put them in review files. Private repository reads require explicit consent. Publish paths bypass stale public caches, validate branch/file revisions and reject changed approvals.

The opt-in `git-batch` mode creates up to sixteen source refs with one atomic, create-only Git push; it never pushes the default branch or overwrites an existing ref. It requires local Git and a distinct reviewed plan. A local write ledger limits GH Aura to 480 reserved writes per hour/account on one machine, **not** GitHub's actual global quota. Unknown outcomes are not automatically retried.

Check GitHub directly after ambiguous operations. Report vulnerabilities through a private channel, never a public issue containing secrets.
