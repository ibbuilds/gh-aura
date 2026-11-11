# GH Aura — product roadmap

**Updated:** 2026-11-11  
**Format:** CLI-only; no web UI; all commands user-triggered  
**North star:** Help a hiring manager find a developer's strongest *verifiable* work in under 60 seconds.

## Product contract

GH Aura analyzes a GitHub profile, identifies presentation gaps, recommends a purposeful showcase, drafts a professional profile README, guides users toward attainable GitHub achievements, and helps recover visibility of genuine previous contributions.

The software is configurable: developers choose the content, tone, profile sections, repositories, languages, and priorities. No automatic overwrites or fabricated history.

### Three profile styles

| Preset | Aesthetic | Initial defaults |
| --- | --- | --- |
| `minimal` | Calm, concise, professional, restrained | Intro, strongest work, contact |
| `regular` | Richer but still polished | About, showcase table, repository languages, contact |
| `flashy` | Distinctive and visual | Centered hero, shields, projects, optional public metrics |

Any section can be toggled in `.gh-aura.json`; presets only establish defaults. Manual customization always wins.

## Modules and status

| Phase | Module | Status / acceptance |
| --- | --- | --- |
| P0 | CLI foundation | **Prototype delivered**: dependency-free Node 22 CLI, offline tests, CI |
| P1 | Public profile audit | **Improved first pass delivered**: bio, profile README, repo metadata, opt-in sample README inspections; needs deeper source evidence |
| P2 | README studio | **Improved first pass delivered**: three profile styles, local output, terminal diff, preview/approval and generic editorial brief |
| P3 | Showcase advisor | **Improved first pass delivered**: explainable metadata ranking, optional sampled README features, manual featured choices; needs richer repo analysis |
| P4 | Achievement navigator | **Guide delivered**: community-sourced catalog; personalized tracking/verification still planned |
| P5 | Contribution diagnostics | **Planned**: actual history and attribution, not graph farming |
| P6 | Engineering timeline | **Planned**: evidence-linked past milestones and genuine evolution |
| P7 | Apply and maintenance | **First pass delivered**: user-reviewed README apply with SHA-256 approval and GitHub SHA conflict checks; additional maintenance planned |

**MVP release gate:** robust P1–P3 on real public profiles, correct formatting for sparse/large accounts, readable errors, complete test coverage for core logic, documentation and repeatable CLI installation.

## Current commands

```bash
gh-aura init
gh-aura audit <username> [--format json]
gh-aura plan <username>
gh-aura showcase <username> [--goal "platform engineer"] [--limit 6]
gh-aura profile <username> [--style minimal|regular|flashy] [--output preview.md]
gh-aura diff <username> [--style minimal|regular|flashy]
gh-aura config show|get|set|reset ...
gh-aura brief <username> --output brief.json
gh-aura preview <username> --file draft.md
gh-aura apply <username> --file draft.md --approve SHA256
gh-aura achievements
```

All analysis, configuration, drafting, and preview commands are local/read-only. The **sole** remote write path is an explicitly approved `apply` command targeting the profile README.

## Roadmap details

### P1: Audit that provides evidence, not an ego score

Read public profile fields, README existence and public repository metadata. Optionally inspect up to 20 candidate project README files, recognizing conventional setup/usage headings without claiming verified code quality. Report verifiable observations with a specific suggested action and source. Future work: verify linked demos, inspect key README files and project setup, and support opt-in authenticated reads.

**Done when:** any public username yields a useful Markdown/JSON report with no invented facts, including edge cases like an empty or very large profile.

### P2: Configurable professional README generator

Minimal (default), regular, and flashy. The user may customize name, headline, summary, technologies, manual featured repositories, exclusions, external links, accent color, additional Markdown sections, and every preset section switch.

**Done when:** the generator can produce professional, readable drafts without asserting fictional credentials or mistaking repository languages for verified expertise. Terminal diff is available for preview.

### P3: Showcase prioritization

Current scores reflect known metadata. In later versions, opt-in source inspection will evaluate README clarity, setup instructions, representative test evidence, package/readme links, releases and maintainability. Emphasize target role, strong project evidence and diversity over stars alone. Recommend up to six; user pins them manually in GitHub.

**Done when:** suggestions are reproducible, role-relevant, transparent and manually overridable.

### P4: Achievement navigator

Maintain catalog entries with source, last verified date, current eligibility, genuinely useful activities, estimated/manual prerequisites and observed status where verifiable. Distinguish historical, unverified, program-only and attainable achievements. Check changes to GitHub eligibility regularly.

**Done when:** no unsupported promise that every badge can be earned, and no mass automation of empty repos, self-stars, artificial issues, reactions, or PRs. GitHub alone decides awards.

### P5: Historical contributions diagnostics

Analyze authentic work from the earliest available data to the present. Explain the GitHub contribution rules, identify missing legitimate attribution (commit email or branch/fork eligibility), visibility settings and public/private limitations. Generate suggestions to publish meaningful future work.

**Done when:** no changing timestamps, authors or history to make a fabricated progression appear real.

### P6: Engineering narrative

Provide opt-in Markdown summaries of actual milestones, useful public work, releases, issue contributions and verified collaborations. Use evidence URLs and preserve dates.

### P7: Safe CLI apply and maintenance

README `apply` now requires a prior `preview` code and fine-grained `contents:write` token. The approval code includes the exact proposed bytes and remote revision. Further work: PR-based updates, improved rollback guidance, and managed maintenance. Scheduled audits, if later offered, produce reports and never generate filler commits.

## Quality criteria

- Clear separation of observations, inferences and user-supplied statements.
- All GitHub writes are off by default; no bypass of access controls.
- One command works without GitHub authentication for public data.
- Style changes must not interfere with profile section/user data overrides.
- Achievements are recorded as **opportunities** unless independently verified.
- User's historical contribution dates remain authentic.
- No visual UI or hosted service. No autonomous profile updates: every command is initiated by the user; publication is a separate approved action.

## Source references

- [GitHub profile reference](https://docs.github.com/en/account-and-profile/reference/profile-reference)
- [Contribution eligibility](https://docs.github.com/en/account-and-profile/reference/profile-contributions-reference)
- [Troubleshooting missing contributions](https://docs.github.com/en/account-and-profile/how-tos/contribution-settings/troubleshooting-missing-contributions)
- [Pinned repositories](https://docs.github.com/en/account-and-profile/how-tos/profile-customization/pinning-items-to-your-profile)
- [Unofficial achievement catalog](https://github.com/christianalberto/github-profile-achievements)

**Issue tracker:** [GH Aura roadmap tasks](https://github.com/ibbuilds/gh-aura/issues).
