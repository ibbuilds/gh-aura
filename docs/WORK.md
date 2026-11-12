# Reviewed documentation pull requests

GH Aura can help you submit **genuine user-authored documentation improvements** from your terminal. It cannot manufacture a contribution, force someone to merge it, or guarantee GitHub's Pull Shark badge.

This is a separate, narrowly scoped workflow from updating your personal profile README.

## Example

Write a useful Markdown improvement in a local file, such as an updated setup guide:

```bash
# Read the proposed change and create a local review record
gh-aura work preview --repo OWNER/PROJECT --path docs/setup.md --file revised-setup.md --save work-review.json

# After checking the complete diff and confirming the work is useful
gh-aura work apply --review work-review.json
```

The second command opens an **unmerged PR** in the repository, if your token grants the necessary permissions. It never merges or bypasses review. You need a fine-grained token with **Contents: write** and **Pull requests: write** restricted to that repository. GitHub's free plan and documented APIs are sufficient.

For private repositories, explicitly add `--private` when previewing. This is saved in the review record. No private repository data is read without this opt-in and appropriate credentials.

## What is permitted

- The root `README.md`, or Markdown documents below `docs/`.
- Creating or updating exactly **one** explicitly selected Markdown document per review.
- Reading the current default branch and file revision without using the public cache.
- Showing a bounded diff, then saving a private, SHA-256-bound review record.
- Creating a deterministic, reviewed branch and an **unmerged** PR only after `work apply`.
- Reusing an already-open matching PR without making another commit.
- Aborting if draft, remote revision, repository, visibility, branch, file or unmerged branch changes.

## What is not implemented

- GitHub achievement awarding or verification.
- Writing new source code, automatically fixing bugs, merging a pull request or submitting an AI-generated contribution unattended.
- Creating placeholder PRs, fake coauthors, stars, reactions, issues or historical commits.
- Proposing to repositories where your token cannot create a branch/PR. Contributing to a third-party repository through a fork is not implemented; use normal GitHub/Git tooling there.
- Automatic rollback of an uncertain network write. If a write fails after branch creation, inspect the branch and PR before retrying.

## Safety

- `work preview` makes only live read requests; `work apply` is the sole write operation for this workflow.
- Before applying, the user must examine the **entire** diff. Documents over 600 lines are refused because the complete review would be too long.
- Approval binds the exact Markdown draft to its repository, branch, path, private/public setting and current remote file revision.
- A mismatched approval is rejected; no force pushes, background commits or retries.
- The created review JSON stores the local draft path and fingerprint but **never** stores tokens or the full content. Keep review files local, especially for private repos.
- No claim that a documentation PR will be merged or qualify for an achievement.

## API use

The preview uses one repository metadata request and one document request. Apply revalidates those live, creates a branch and writes the approved document only if necessary, checks the resulting single-file diff and then opens a PR. Only the apply stage requests write permissions. This workflow cannot be run periodically or automatically by GH Aura.

For the related achievement preparation commands, see [Achievement actions](ACHIEVEMENT_ACTIONS.md).
