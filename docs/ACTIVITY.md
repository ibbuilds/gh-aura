# Activity: observed contributions and optional private practice

The `activity YEAR` and `contributions` commands inspect observed GitHub activity without modifying it. The same `activity` command also supports [offline practice planning and reviewed apply](CALENDAR.md), using one reusable private workspace for synthetic commits. Generated activity is not historical professional work; GitHub controls what the contribution graph counts.

## Use

The ordinary command remains `gh-aura contributions`. The new flags are optional:

```bash
gh-aura contributions --all
gh-aura contributions --year 2024
gh-aura contributions --from 2020-01-01 --to 2024-12-31
gh-aura contributions --from 2020 --to 2024 --days --json --output history.json
gh-aura contributions --from 2020 --to 2026 --private --recover
gh-aura contributions --plan
```

A year shorthand expands to January 1/December 31. The report uses **UTC** and splits requested intervals into one-calendar-year API windows. If the start predates account creation, it starts with the account's first UTC date. Historical windows are batched in up to **four** read-only GraphQL collections per request to reduce network overhead. The request byte/session budgets still apply.

`--days` includes observed daily totals (including real zeros reported by GitHub). Without it, the output stays compact. These totals are GitHub-visible events subject to permissions and calendar eligibility, not a statement that the person worked on every day.

`--private` adds privacy guidance; it does not unlock private repositories or change the user's contribution visibility. On GitHub, visit **Your profile → Contribution settings → Private contributions** to opt into anonymized private counts. The report never exports private repository names.

`--plan` adds a **future-only** set of candidate improvements to up to three existing public owned repos. These are conditional ideas based on real repo metadata; GH Aura does not invent an open issue, a missing test or a calendar date. The user confirms a substantive need, writes and tests the change, and follows the normal repository process. It makes no additional API calls.

`--recover` produces a checklist for **actual** historical work: inspect original commit author emails locally, associate eligible old emails with the account, check qualifying default/gh-pages branches, forks, and private visibility. GH Aura makes **zero** history edits. GitHub can rebuild a contribution graph after a legitimately used old author email is associated with the account.

When authentication is missing, daily and annual GraphQL contribution counts remain **unknown**, not zero. A valid token supplies read access; it is never written into the report.

## Local Git attribution diagnosis (fully offline)

```bash
gh-aura contributions --local .
gh-aura contributions --local /path/to/actual-repo --from 2020 --to 2026 --json
# Optional: a local-only text file listing Git author emails you have linked to GitHub
gh-aura contributions --local . --emails-file verified-emails.txt
```

Unlike GitHub GraphQL reports, these commands inspect *only a repository you name*, using local Git. No tokens, GitHub API requests, raw emails, commit messages, private source files or remote URLs are included in the output. The CLI compares up to 5,000 original author email values against your local `git config user.email` or an optional local-only identity file, reporting counts without printing identities. **A match is not proof that the email is verified on GitHub or that a commit qualifies for the graph.** Shallow or capped history is explicitly identified. It neither modifies Git nor supplies fabricated calendar dates.

## Create or reuse one private workspace

```bash
gh-aura init USERNAME
gh-aura activity plan 2022 --density 70 --output plan.json
gh-aura activity apply --review plan.json --confirm FINGERPRINT --author-name NAME --author-email VERIFIED_EMAIL
```

The first approved apply creates the workspace (default `USERNAME/gh-aura-workspace`) and future plans append without changing the existing history. `badges auto` reuses this same workspace by default. The old `calendar` command remains a compatibility alias. See [activity workspace](CALENDAR.md) for the exact safety rules and caveats.

## Limitations

- GitHub counts eligible activity, not hours worked, seniority or code quality.
- A changed Git author date or an artificially backdated commit does not prove old work.
- GitHub can show anonymized private activity; that does not reveal repo details to outsiders.
- Account privacy is a user setting; visibility may differ for owners, organization members and anonymous visitors.
- A zero or incomplete GraphQL response is not proof of inactivity.
- Batch queries have higher GraphQL complexity than a single-year query even when the HTTP request count is lower; the max-four policy bounds that complexity.

## Official sources

- [Profile contributions reference](https://docs.github.com/en/account-and-profile/reference/profile-contributions-reference)
- [Troubleshooting missing contributions](https://docs.github.com/en/account-and-profile/how-tos/contribution-settings/troubleshooting-missing-contributions)
- [Private contributions and achievements visibility](https://docs.github.com/en/account-and-profile/how-tos/contribution-settings/manage-visibility-settings-for-private-contributions-and-achievements)
