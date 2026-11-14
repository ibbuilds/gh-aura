# Badges: one private workspace

GH Aura attempts **Pull Shark, YOLO and Quickdraw** through one authenticated, user-owned, marked private repository. GitHub may reject private/self-generated award eligibility.

## Use

```bash
gh-aura init USERNAME
gh-aura badges auto --tier base --strategy git-batch --output pilot.json
gh-aura badges auto apply --review pilot.json --confirm FINGERPRINT
gh-aura badges auto status
# Check actual achievements on GitHub before attempting more:
gh-aura badges auto next --goal max --strategy git-batch --output next.json
gh-aura badges auto apply --review next.json --confirm NEXT_FINGERPRINT
```

`--goal max` stages the reported Pull Shark milestones **2 → 16 → 128 → 1,024**, in batches of up to **16 PRs**. Each new plan requires separate SHA-256 approval. The default workspace is `USERNAME/gh-aura-workspace`; configure once with `gh-aura config set workspace.repo OWNER/NAME` if needed.

## Optional second account

```bash
# Set two separate credentials in your trusted local terminal:
export GH_TOKEN=PRIMARY_TOKEN
export GH_AURA_COLLAB_TOKEN=SECONDARY_TOKEN
gh-aura badges auto accounts
```

This verifies distinct accounts that **both read the same marked private workspace**. The collaborator needs existing access. Tokens remain local and are never printed or saved in configuration. This command **does not** check write rights, perform coauthored commits, accept Discussion answers or guarantee awards.

The [whole-profile workflow](IMPROVE.md) adds reviewed coauthor/Q&A exercises and tier-gated campaigns with one approval. It checks identities/access and lists token scopes. Actual private award eligibility remains unverified.

## Execution strategies

- `rest` (default): GitHub REST branch creation, file commit, PR creation and merge.
- `git-batch` (needs Git): up to 16 local branches, one **atomic create-only push**, then PRs and SHA-checked merges. Its v3 plans preserve v1/v2 REST compatibility.
- Both reject public, foreign, unmarked, archived or forked workspaces. No force-update, branch overwrite, hidden retry, automatic deletion or account spoofing.
- Every mutation batch is bounded and paced; a local per-account budget reserves up to **480 writes/hour**. GitHub may impose tighter limits or count Git transport differently.
- `status` reports only observed events, review-free self-merge candidates and issues closed within five minutes; it **cannot certify an achievement**.
- No accounts, stars, paid sponsors, fake collaborators or external discussion activity are generated.

**Stop after the first two PRs if the actual badge does not appear.** A real disposable-account pilot and verification are still pending. [Scope and blockers](PRODUCT_PLAN.md) · [Security](../SECURITY.md).
