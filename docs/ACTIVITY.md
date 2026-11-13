# Activity

**Observed activity** and **synthetic dated practice** are separate.

## Read actual contributions

```bash
gh-aura activity 2022
gh-aura activity 2020..2025
gh-aura contributions --all --days
gh-aura contributions --local . --emails-file verified.txt
```

GitHub determines the observed counts. Private contribution visibility is a GitHub account setting. `--recover` offers attribution guidance for genuine existing work, never a rewrite.

## Plan and apply synthetic practice

```bash
gh-aura init USERNAME
gh-aura activity plan --from 2022-07-01 --to 2022-07-31 \
  --density 80 --mode seasonal --intensity 3 --output plan.json
gh-aura activity preview --review plan.json --svg --output preview.svg
# Read the plan and its SHA-256 fingerprint before approving:
gh-aura activity apply --review plan.json --confirm FINGERPRINT \
  --author-name "Name" --author-email VERIFIED_EMAIL
```

- `--density 0..100` targets a percentage of dates, not guaranteed graph colors.
- `--intensity 1..6` controls commits on selected days; optional `--weekends`, `--growth` and `--seed` shape distribution.
- The plan has a limit of 2,500 commits and a range of at most 20 years.
- The first approved apply creates `USERNAME/gh-aura-workspace` as **private**, unless a marked workspace already exists. Badge exercises reuse it.
- Repeated applies only append nonconflicting files via fast-forward Git push. Public/unmarked/forked/archived repos, unverified author email, collisions and changed remote history are rejected.
- Generated content is labeled synthetic. GitHub alone decides if it counts as a contribution.

`calendar` remains a legacy alias. No deletion or force push is automated.

`activity preview` compares baseline, additions and projected totals by UTC date. JSON is the default; `--svg` exports an original visual comparison. For multi-year plans, choose `--year YYYY`. Unknown dates stay unknown, including legacy plans without supplied history. Illustration colors do not predict GitHub's shades or confirm attribution. Preview performs no network request or Git write.
