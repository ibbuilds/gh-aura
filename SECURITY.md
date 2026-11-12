# Security

GH Aura is local-first. MCP and Agent Skills expose **read-only** discovery, context, specs, validation and diff; no publish, approval, arbitrary shell or remote write tool. Reads and plans do not write to GitHub. The only remote write commands are `apply`, `work apply`, `activity apply` and `badges auto apply`; each needs an explicit reviewed plan or diff.

## Scope

- `apply` targets the authenticated user's profile README, with optional unmerged `--pr`.
- `work apply` opens an unmerged PR changing one user-authored Markdown document.
- `activity apply` appends labeled synthetic commits to one **owned, marked private workspace**, without force pushing existing history.
- `badges auto apply` reuses that workspace for bounded PR/issue exercises; it may merge **only** its own synthetic sandbox PRs.

Public, foreign, forked, archived or unmarked existing workspace repos are rejected. No automatic workspace deletion, force push, other users, private-account scraping or guaranteed achievement award.

## Permissions and approvals

Use `GH_TOKEN` or `GITHUB_TOKEN` with the least required access. Optional `GH_AURA_COLLAB_TOKEN` authenticates a distinct second account for the **read-only** `badges auto accounts` preflight only. It must already be authorized to view the private workspace. Neither token is stored by GH Aura. Contents write is needed for publishing; PRs and Issues permissions are needed for badge events. Never commit tokens or put them in review files. Private repository reads require explicit consent. Publish paths bypass stale public caches, validate branch/file revisions and reject changed approvals.

The opt-in `git-batch` mode creates up to sixteen source refs with one atomic, create-only Git push; it never pushes the default branch or overwrites an existing ref. It requires local Git and a distinct reviewed plan. A local write ledger limits GH Aura to 480 reserved writes per hour/account on one machine, **not** GitHub's actual global quota. Unknown outcomes are not automatically retried.

MCP runs over bounded local stdio. Third-party sources are reference data, opt-in for external images, and never copied or fetched automatically. Agent tools do not mint approval codes; users review Markdown and publish through independent CLI actions. The connected AI application may process returned profile data under its own privacy policy.

Check GitHub directly after ambiguous operations. Report vulnerabilities through a private channel, never a public issue containing secrets.
