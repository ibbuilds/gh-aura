# Activity — private contribution practice

GH Aura can plan **synthetic, explicitly labeled** Git commits for selected UTC dates and upload them into **one user-owned private workspace**. This can affect the contribution graph when GitHub's eligibility rules are satisfied, but does **not** establish real historical professional work and cannot guarantee a particular graph color or total.

There is no separate product called "Calendar Studio". The public CLI commands are `gh-aura activity plan` and `gh-aura activity apply`. The older `gh-aura calendar` alias remains available to avoid breaking existing scripts.

## Set up a reusable workspace

```bash
gh-aura init YOUR_USERNAME
# Implicit default: YOUR_USERNAME/gh-aura-workspace
# Optional: use a different private workspace for BOTH activity and badges.
gh-aura config set workspace.repo YOUR_USERNAME/my-aura-private
```

Neither configuration command creates a GitHub repository. The **first explicitly approved apply** creates it if missing; later activity and badge operations reuse the same marked private repository. An existing unmarked repository is never silently adopted or modified.

## Plan (offline)

```bash
# Year: target activity on 70% of dates
gh-aura activity plan 2022 --density 70 --output plan.json

# One month: target all dates; weekend preferences will not block 100%
gh-aura activity plan --from 2022-07-01 --to 2022-07-31 \
  --density 100 --intensity 1 --output month.json

# Multiple years with weighted distribution and a stable seed
gh-aura activity plan --from 2020 --to 2025 --density 75 --growth 65 \
  --weekends 20 --intensity 3 --mode workweek --seed 42 --output years.json

# Preserve actually observed GitHub activity when supplying a complete daily export
gh-aura contributions --all --days --json --output actual.json
gh-aura activity plan 2022 --density 80 --existing actual.json --output gaps.json
```

`--density` is a target percentage of active **dates**, not a guaranteed GitHub color shade. `--intensity 1..6` controls generated commits per selected day. `--weekends 0..100` shapes date preference, and `--mode workweek|uniform|seasonal` determines distribution. `--seed` makes planning reproducible. Plans are limited to 20 calendar years and 2,500 commits each.

The plan contains its selected dates, counts, synthetic labels and a SHA-256 fingerprint. No network access or remote changes occur in this step.

## Apply (explicit GitHub write)

```bash
gh-aura activity apply --review plan.json --confirm THE_64_CHARACTER_FINGERPRINT \
  --author-name "Display Name" --author-email YOUR_VERIFIED_EMAIL
```

A private GitHub token is required. The author email must be verified as belonging to the authenticated account, or be its matching ID-based GitHub `noreply` address. The selected dates must be within the authenticated account's lifetime. See [Security](../SECURITY.md).

The first apply creates `YOUR_USERNAME/gh-aura-workspace` (or the configured name), with a GH Aura workspace marker in its README and a single Git push. Subsequent applies:

1. Verify ownership, private visibility, non-fork status and the workspace marker.
2. Read the complete repository tree and reject any generated path collisions; truncated inspection fails closed.
3. Fetch the existing default branch and verify its exact revision.
4. Append generated commits as **descendants** of that revision and push **without force**. If GitHub has moved the branch, the push refuses to overwrite it.

Badge exercises are preserved on the same default branch. Old, unmarked standalone repositories are **not** automatically adopted; manually inspect them before selecting a new workspace.

## Verification and limits

The CLI can verify the exact planned commit count and a successful Git push, but only GitHub determines whether those contributions appear on the account's graph. Private contributions must be enabled in GitHub account settings if the user wants their anonymized counts to be visible. GitHub attribution and indexing can take time. Never describe generated practice as verified historical employment or engineering output.

Repeating the same date plan cannot overwrite an existing practice file. To add more, plan a non-overlapping range or inspect the existing workspace. If GitHub operations fail halfway through, inspect the repository before trying again.

**Do not delete the shared workspace just to clean up badges.** It may contain synthetic activity history or other exercise work; GitHub does not guarantee how deletion will affect contribution counts or historical achievement evidence. Any future cleanup must be separate, deliberate and confirm the exact target.

[Activity reference](ACTIVITY.md) · [Badge exercises](BADGE_RUN.md) · [GitHub contribution criteria](https://docs.github.com/en/account-and-profile/reference/profile-contributions-reference)
