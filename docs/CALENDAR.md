# Calendar Studio (explicit synthetic practice)

GH Aura can build a **configurable synthetic practice timeline** for a user-owned **new private repository**. It is a sequence of real Git commits with explicit dates, but it is **not a record of work performed in those years**. GitHub decides how, or whether, these events appear on the contribution calendar.

## Preview first — zero API requests

Use the new \`calendar\` command without changing any GitHub account:

\`\`\`bash
# One year: target 70% active days
gh-aura calendar plan 2022 --density 70 --output 2022.json

# Multi-year growth, moderate weekends and 1-3 commits per selected day
gh-aura calendar plan --from 2020 --to 2025 --density 75 --growth 65 \
  --weekends 20 --intensity 3 --mode workweek --seed 42 --role "backend" --output progression.json

# Preserve existing calendar activity; only fill gaps when observed history permits
gh-aura contributions --all --days --json --output history.json
gh-aura calendar plan 2022 --density 80 --existing history.json --output gaps.json
\`\`\`

The JSON blueprint reports dates, count per date, requested density, existing observed activity and a **SHA-256 fingerprint**. It does not create a repository or a commit. Inputs are limited to 20 years and at most **2,500 new commits** per blueprint. When existing data is supplied, every date must actually be present in the export; unknown days are never silently assumed empty.

### Settings

| Option | Meaning |
| --- | --- |
| \`--year YYYY\` or \`calendar plan YYYY\` | Select one UTC calendar year |
| \`--from YYYY[-MM-DD] --to YYYY[-MM-DD]\` | Select a period (up to today and at most 20 calendar years) |
| \`--density 0..100\` | Target percentage of active dates per calendar year |
| \`--growth 0..100\` | How strongly target density increases from the earliest to the latest year |
| \`--weekends 0..100\` | Relative weekend activity preference |
| \`--intensity 1..6\` | Maximum number of practice commits per selected date |
| \`--mode workweek|uniform|seasonal\` | Preferred work/rest day distribution |
| \`--seed N\` | Makes planning deterministic for identical options |
| \`--role TEXT\` | Label for practice exercises; **not** a professional credential |
| \`--existing FILE\` | Use GH Aura's actual \`contributions --days --json\` export to avoid dates with observed activity |

To approximate an existing pattern, start with actual date observations and choose \`--existing\`. The tool will never invent private/unknown observations.

## Execute only on a new private repository

After reviewing the blueprint and its printed fingerprint:

\`\`\`bash
# Requires a free personal GitHub token with permission to create a private repository.
# Author email must belong to the authenticated GitHub account.
gh-aura calendar apply --review 2022.json --repo YOUR_USERNAME/aura-practice-2022 \
  --author-name "Your Display Name" --author-email YOUR_VERIFIED_EMAIL \
  --confirm THE_64_CHARACTER_FINGERPRINT
\`\`\`

Only \`calendar apply\` can create a new private repo and push. It refuses existing repositories, non-owned targets, mismatched fingerprints, years before the user's account creation and invalid identities. It creates the complete deterministic local Git history first, then makes **one Git push** (rather than sending one REST request per commit). Credentials are provided only through ephemeral Git environment variables, never command arguments, local Git config or saved plan files.

Generated documentation in each practice commit is explicitly marked **synthetic**. GitHub profile contributions may not update immediately; ensure [Private contributions](https://docs.github.com/en/account-and-profile/how-tos/contribution-settings/manage-visibility-settings-for-private-contributions-and-achievements) is enabled and that the authored email is verified. **Do not infer employment, years of experience or badge eligibility from this activity.**

### Verified author identity (v1.8.1)

Before any repository creation, GH Aura verifies the author identity. The ID-based `ID+USERNAME@users.noreply.github.com` address derived from the authenticated account works without extra email scope. For other addresses, the token requires the GitHub **Email addresses (read)** user permission or `user:email` (classic personal access token), and the address must appear as **verified**. A missing permission, unverified email or unavailable account creation timestamp fails closed. The list of private account emails is never logged, cached or saved to a plan.

### Resource and safety limits

- No automatic background process, repeated requests, force-push, history edits or writes to existing repositories.
- Every plan can be reviewed and reproduced offline with a seed.
- A private repository creation may succeed even if Git push later fails; inspect GitHub before retrying with a new repo name.
- The actual repository creation and commit attribution are only testable against an authorized account. CI uses isolated temporary local Git repositories and mocked API creation — no real private repo is created in tests.
- GitHub can reject the repository creation, Git credentials or commit attribution under its own rules.

[Contribution rules](https://docs.github.com/en/account-and-profile/reference/profile-contributions-reference) · [Main CLI](CLI.md)
