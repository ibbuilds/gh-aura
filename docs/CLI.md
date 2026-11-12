# Commands

Run `gh-aura COMMAND --help` for exact flags. All reads/plans are local or read-only unless a command explicitly says `apply`.

## Four workflows

| Command | What it does |
| --- | --- |
| `activity YEAR` or `activity YEAR..YEAR` | Inspect observed contributions |
| `badges free`, `badges all`, `badges BADGE_ID` | Explain achievement eligibility |
| `readme minimal|regular|flashy` | Draft a profile README |
| `pins --goal "backend"` | Rank public repositories; pin manually |

## Activity

```bash
gh-aura activity 2022
gh-aura activity plan 2022 --density 70 --output activity.json
gh-aura activity apply --review activity.json --confirm FINGERPRINT \
  --author-name "Name" --author-email VERIFIED_EMAIL
```

`--density 0..100` selects the proportion of dates; `--intensity 1..6` controls commits/day. Date ranges, `--mode`, `--weekends`, `--growth` and `--seed` are optional. Plans are synthetic, not past professional work.

## Achievements

```bash
gh-aura badges free
gh-aura badges auto --tier base --strategy git-batch --output badges.json
gh-aura badges auto apply --review badges.json --confirm FINGERPRINT
gh-aura badges auto status
gh-aura badges auto next --goal max --strategy git-batch --output next.json
```

Every batch requires its own reviewed fingerprint. Up to 16 PRs per batch, one marked private workspace, never a guaranteed award. [Badge rules](ACHIEVEMENTS.md) · [Runner](BADGE_RUN.md).

## README and pins

```bash
gh-aura readme minimal --output draft.md
gh-aura check --file draft.md
gh-aura preview --file draft.md --save review.json
gh-aura apply --review review.json --pr
gh-aura pins --goal "backend" --limit 6
```

A profile `apply` without `--pr` publishes the approved README directly. Both check remote revisions.

## Additional tools

```bash
gh-aura audit --goal "backend" --inspect 3 --deep 2
gh-aura contributions --all --days
gh-aura contributions --local . --emails-file emails.txt
gh-aura achievements --scope free --plan
gh-aura config show
gh-aura story list
gh-aura brief --prompt
gh-aura references
gh-aura work preview --repo OWNER/REPO --path docs/setup.md --file edit.md --save work.json
gh-aura work apply --review work.json
```

`work apply` opens an unmerged PR for one user-authored Markdown file, not automatic collaboration. [Work safety](WORK.md).

Use `--fresh` for updated public reads, `--budget N` to bound API calls, `--stats` for request counts. Authenticated GraphQL/private workflows require a suitable `GH_TOKEN` or `GITHUB_TOKEN`. Nothing runs in the background.
