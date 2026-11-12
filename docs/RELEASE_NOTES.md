# GH Aura v1.14.0

**Atomic Git batching for faster private achievement exercises, opt-in only.**

The previous REST runner created a branch and file through two REST writes per PR, then opened and merged it through two additional writes. `--strategy git-batch` prepares up to 16 synthetic source commits locally, publishes all the branches via **one atomic create-only Git push**, then still opens and merges each PR through GitHub's standard API.

For **16 PRs**, that's roughly **64 REST writes (old) versus 32 REST writes plus one Git push (new)**. For the 1,024-PR Gold target, the conceptual comparison is **4,096 REST writes versus 2,048 REST writes plus 64 atomic pushes**. These are request counts, *not* measured wall-clock improvements or guarantees of qualifying GitHub achievements. GitHub may account for pushes differently and enforce additional limits.

## Example

```bash
gh-aura init YOUR_USERNAME
gh-aura badges auto --tier base --strategy git-batch --output pilot.json
# Inspect pilot.json before explicitly approving its own SHA-256 fingerprint:
gh-aura badges auto apply --review pilot.json --confirm FINGERPRINT
gh-aura badges auto status

# Only after confirming real badge eligibility:
gh-aura badges auto next --goal max --strategy git-batch --output next.json
gh-aura badges auto apply --review next.json --confirm NEXT_FINGERPRINT
```

The strategy is explicitly bound into a new v3 plan; v1/v2 plans remain supported as REST plans. Source branches are never force-updated: Git first verifies the exact default-branch SHA, checks for any existing target refs, uses empty-expected leases and one atomic push, then verifies every pushed SHA. The default branch is **never directly pushed**. No unrelated existing repo is touched, and no new workspace is created when one already exists.

The local rate ledger conservatively reserves one unit per staged branch as well as each PR write. There is no fallback to non-atomic pushes or retry of an uncertain remote mutation.

CI tests real local bare-repository Git pushes, simulated GitHub REST operations, package installation, and strictly read-only public GitHub integration on Node 22/24 across Linux, macOS and Windows. **Real private GitHub.com write tests and awarded badges remain unverified.**

[Fast Git batching](https://github.com/ibbuilds/gh-aura/blob/main/docs/BADGE_FAST.md) · [Achievements](https://github.com/ibbuilds/gh-aura/blob/main/docs/ACHIEVEMENTS.md) · [Release readiness](https://github.com/ibbuilds/gh-aura/blob/main/docs/RELEASE_READINESS.md)
