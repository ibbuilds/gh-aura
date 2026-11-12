# Fast badge batches — atomic multi-ref Git push

**Status:** experimental, opt-in, locally testable. GH Aura does not grant badges or guarantee that GitHub counts private/self-owned synthetic exercises toward achievements.

## Why this can be faster

The original REST strategy creates a branch (POST), commits an exercise file (PUT), opens its PR (POST), and merges it (PUT): roughly **four REST mutations per PR**, excluding one-time repo initialization.

With the **`git-batch`** strategy, GH Aura builds up to 16 separate branch commits locally using `git fast-import`, then pushes all newly generated branch refs in **one atomic create-only Git push**. It still creates and merges each PR through the standard GitHub REST API, so each PR is still a real, independently merged GitHub event:

| Work in one complete 16-PR batch | REST strategy | Atomic Git strategy |
| --- | ---: | ---: |
| Branch creation / synthetic commit REST mutations | 32 | 0 |
| Git push for prepared branches | 0 | 1 atomic multi-ref push |
| Open PR + merge PR REST mutations | 32 | 32 |
| Default branch direct updates / history rewrites | 0 | 0 |

Thus a successful batch **halves the number of REST content-writing calls**, but does **not** guarantee half the wall-clock time. GitHub's primary and secondary rate limits, Git push limits, anti-abuse heuristics and achievement processing all still apply. GH Aura conservatively reserves **one local hourly write-budget unit per new branch pushed**, plus one for each PR creation and merge; the actual way GitHub accounts for a Git transport push is not published as a simple per-ref rate-limit conversion.

For 1,024 eligible PRs, the difference is approximately **4,096 REST writes (old) versus 2,048 REST writes plus 64 atomic Git pushes (new)**, assuming 64 complete 16-PR batches. Even this is not an earned Gold guarantee: the only authority for awards is GitHub's profile, not GH Aura's API-event counter.

## Usage — always review before remote changes

```bash
gh-aura init YOUR_USERNAME

# Start with a 2-PR pilot, not 1,024 speculative exercises.
gh-aura badges auto --tier base --strategy git-batch --output pilot.json
# Review pilot.json (strategy, repo, operations, fingerprint) before approval.
gh-aura badges auto apply --review pilot.json --confirm FINGERPRINT

# Inspect observed events and manually verify the badge on GitHub.
gh-aura badges auto status

# Only after the private pilot qualifies for GitHub awards:
gh-aura badges auto next --goal max --strategy git-batch --output next.json
gh-aura badges auto apply --review next.json --confirm NEXT_FINGERPRINT
```

The Git transport strategy requires `git` on PATH in addition to Node.js 22+. It requires the token's private repository Contents, Pull requests and Issues permissions for the owned workspace, as in the REST runner. The legacy/default `rest` strategy remains supported. All new bulk plans use a distinct **v3 fingerprint-bound review format**, and v1/v2 plans remain valid for their original REST semantics.

## Git integrity rules

- Only a repository owned by the authenticated account, explicitly private and marked with GH Aura's marker, may be modified. No existing unmarked repo is adopted.
- Existing completed exercise files are skipped; every remaining remote exercise ref must be **absent**. A previous interrupted/partially completed bulk push fails closed for manual inspection instead of overwriting an existing branch.
- The local Git object store fetches exactly the current default-branch ref and checks its SHA against a fresh GitHub API read before preparing new commits.
- Each branch contains one clearly synthetic file, with the same verified default parent as the other batch refs. `git push --atomic` and a per-ref **empty expected lease** ensure either all new refs are created or none are; existing refs are not force-updated. The default branch is **never directly pushed**.
- After the push, GH Aura compares the exact remote Git ref SHAs to the local expected SHAs before opening any PR.
- Each PR must report the expected head SHA; the runner checks submitted reviews and merges with GitHub's SHA precondition, without retries after uncertain writes.
- Credentials are supplied only through ephemeral Git environment variables. They are never written to command arguments, remote URLs, repository content or saved plans.
- The local per-account hourly safety ledger covers each newly created branch conservatively, plus the PR operations. It does not see activity from other clients or computers.
- If the server does not support atomic push or declines the request, **there is no non-atomic or forced fallback**. Inspect the repository state before trying again.

## What remains unverified

Unit tests use real local bare Git repositories, fast-import, create-only atomic pushes and simulated GitHub REST responses. They do **not** prove GitHub.com accepted a private multi-ref push, nor that synthetic self-owned PR merges result in Pull Shark, YOLO or Quickdraw. Validate only the 2-PR pilot with an authorized disposable account first.

Official references: [Git push and atomic ref updates](https://git-scm.com/docs/git-push) · [GitHub REST best practices](https://docs.github.com/en/rest/using-the-rest-api/best-practices-for-using-the-rest-api) · [Secondary rate limits](https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api) · [Achievements and private activity](https://docs.github.com/en/account-and-profile/how-tos/contribution-settings/manage-visibility-settings-for-private-contributions-and-achievements)
