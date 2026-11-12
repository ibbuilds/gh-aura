# GH Aura 1.5.1

**Maintenance release: authentic, optional future work planning.**

## Install

Requires Node.js 22+.

```bash
npm install --global ./gh-aura-1.5.1.tgz
gh-aura init YOUR_USERNAME
```

Download the versioned tarball and `SHA256SUMS.txt` from this GitHub Release. GH Aura has no runtime dependencies or paid API requirements; the package is distributed via GitHub Releases rather than the npm registry.

## What's new

- `gh-aura contributions --plan` proposes up to three conditional tasks in real public owned repositories. The user must independently confirm a missing test, useful bug fix or documentation need before doing the work.
- The plan does not fabricate contribution dates, pending issues, commits or awards, and it makes **zero additional API requests** beyond the existing public snapshot.
- Works without a token; actual yearly contribution totals still require an authenticated GitHub read.
- Adds offline tests for empty, fork-heavy and no-token cases, plus normal cross-platform, installed-package and live read-only integration checks.

All GH Aura 1.5.0 capabilities remain available: activity date ranges, achievement capability planning, selected repository evidence, user-supplied project narratives, Spanish/English profile headings, local job-description matching, and reviewed profile README publication.

## Suggested commands

```bash
gh-aura contributions --plan
gh-aura contributions --from 2020 --to 2026 --recover
gh-aura achievements --plan --scope free
gh-aura audit --job vacancy.txt --deep 2
gh-aura profile --language es --style minimal --output draft.md
gh-aura preview --file draft.md --save review.json
# Publish only after reviewing the diff:
gh-aura apply --review review.json --pr
```

**Limits:** GitHub alone awards achievements and determines contribution eligibility. GH Aura does not create synthetic history, automatically generate meaningful engineering work, pay for badges, pin projects or infer job offers from GitHub metadata. No changes were made to a user's personal profile as part of release testing.
