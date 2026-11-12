# Private achievement workflow automation

GH Aura can run **bounded GitHub workflow exercises** on one privately owned repo without third-party collaboration. GitHub controls what constitutes an Achievement, and may ignore self-generated or private events; **this is a best-effort action runner, not an achievement-granting API**.

## One-command plan, then explicit apply

\`\`\`bash
gh-aura badges auto --repo YOUR_USERNAME/aura-achievements --pulls 2 --output badges.json

# Read badges.json, including its 64-character fingerprint.
gh-aura badges auto apply --review badges.json --confirm FINGERPRINT
\`\`\`

The first command is **completely offline**. The second command requires a free GitHub access token with repository creation, Contents write, Pull requests write, and Issues write for a private repository. GitHub's permission settings may also require approval by your account/organization.

A successful run creates **only a private GitHub repository owned by the authenticated user**, with a marker identifying it as an automated sandbox. It attempts:

- **Pull Shark:** generate 2 individually reviewable exercise documents, open two PRs and merge them with GitHub's standard merge endpoint if repository rules permit.
- **YOLO:** those PR merges may be unreviewed in this user-owned sandbox; whether GitHub awards the badge depends on its current conditions.
- **Quickdraw:** open and promptly close one clearly labeled private sandbox QA issue.

You can change \`--pulls\` from **0 to 16 per execution**, \`--start\` from 0 to 1024 (for later batches), and disable the QA issue with \`--no-quickdraw\`. Each batch is independently fingerprinted and requires a new explicit apply.

\`\`\`bash
# Example: repeat with a new, nonoverlapping sequence after checking GitHub
gh-aura badges auto --repo YOUR_USERNAME/aura-achievements --pulls 16 --start 2 --no-quickdraw --output second.json
gh-aura badges auto apply --review second.json --confirm SECOND_FINGERPRINT
\`\`\`

The runner checks existing merged document paths and skips already completed exercises. It refuses a public, archived, forked or unmarked existing repo; it never attempts to use another account or organization's project. Branch conflicts stop the run without a force push. It does not create fake coauthors, star networks, discussions with fabricated answers, or external pull requests.

## Explicit exclusions

| Achievement | Why not fully controlled by one account in a private repo |
| --- | --- |
| Pair Extraordinaire | Crediting a real consenting co-author requires another person |
| Galaxy Brain | Accepted Q&A answers depend on Discussions roles/rules and may need another participant |
| Starstruck | Independent people must voluntarily star a public project |
| Arctic Code Vault | Historical event, not newly obtainable |
| Public Sponsor | Involves payment; excluded from the free workflow |
| Pro, Campus Expert, security programs | Require plan/program eligibility or external review |

Other experimental or retired badges are not advertised as automatable.

## Status and privacy

- \`badge-run apply\` returns the issue/PR URLs and reports **requested operations**, not an awarded achievement. Verify your account at \`https://github.com/YOUR_USERNAME?tab=achievements\` after GitHub processes the events.
- [Private contribution and achievement visibility](https://docs.github.com/en/account-and-profile/how-tos/contribution-settings/manage-visibility-settings-for-private-contributions-and-achievements) is a manual GitHub account setting, not something this tool changes.
- GitHub can withhold or retract awards, apply additional heuristics, or change rules. Private/self-owned actions are **not guaranteed** to count.
- Generated files explicitly identify themselves as automation exercises, not historical professional work.
- **Never run this against a production repository:** only an owned repo marked by this tool. The user explicitly approves each batch before any write.
- No paid API, hosted backend, background process, third-party automation or mandatory AI provider.

## Request budget and failure handling

Actions use the official GitHub REST API with a hard request limit of \`20 + 12 * pulls\` per run; no automatic retries of uncertain writes. An interrupted run may leave a private repo, a branch, an open PR or an issue. Check those objects before retrying with the same plan. GH Aura does not delete the repo automatically or weaken branch protection. The target repository is always private, and token credentials never appear in saved plans or logs.

[Achievement registry](ACHIEVEMENTS.md) · [Security boundary](../SECURITY.md)
