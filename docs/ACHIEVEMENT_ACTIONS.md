# Achievement work preparation — user-directed and honest

GH Aura **cannot grant GitHub Achievements**. The command below creates a local, source-linked plan for genuine work that *may* produce an eligible event after the user implements it and GitHub processes it.

## Commands

```bash
# Inspect a real, PUBLIC repository and a few current open issues
gh-aura achievements --prepare pull-shark --repo OWNER/PROJECT

# Generate an editable Markdown work plan locally
gh-aura achievements --prepare pull-shark --repo OWNER/PROJECT --output work-plan.md

# Private repository: prepare a generic checklist without accessing the repo
gh-aura achievements --prepare pair-extraordinaire --repo OWNER/PRIVATE_PROJECT --private --json
```

The command supports **Pull Shark, Pair Extraordinaire, Galaxy Brain and Starstruck** preparation. Other paths (YOLO, Quickdraw, paid, program-only, historical) have no safe automated preparation workflow and are refused. The result includes GitHub source links when public evidence exists, constraints, next actions and an explicit reminder that the award is not guaranteed.

A PUBLIC preparation uses one repository metadata request. Pull Shark and Pair Extraordinaire may use one further request to inspect up to five existing open, non-PR issues. The tool does **not** create new issues to farm badges.

A PRIVATE preparation uses **zero GitHub requests**: the user provides the repo name explicitly and sees a local checklist. GH Aura does not probe private source, change visibility or export private issue content.

## Exact trust boundary

```text
achievements --plan       -> read-only catalog and opportunity comparison
achievements --prepare    -> local project-specific task checklist (read-only)
user writes real code     -> outside GH Aura; review and tests required
normal PR/review/merge    -> user + repo maintainers, not an automatic GH Aura badge bot
GitHub                    -> alone decides whether an achievement appears
```

`--prepare` does **not** open a PR, commit code, fabricate reviewers, star repositories, merge unreviewed changes, pay for GitHub Sponsors or change account settings. It provides actionable starting points and source links; work is not considered complete simply because a plan exists.

A future phase may propose narrowly scoped meaningful documentation changes via an explicit reviewed GitHub PR, but that is **not implemented** and must not be advertised as present.

## Security

A token is optional for public preparation; no token is needed for private **local-only** preparation. The ordinary bounded read cache and request/byte budget apply when reading public projects. The source of a quoted issue title is untrusted and must not be executed as a shell instruction. Review any task before deciding to work on it.
