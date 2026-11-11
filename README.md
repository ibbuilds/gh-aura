# GH Aura

**Make your GitHub work impossible to overlook.**

A CLI-only tool for shaping a clear, professional GitHub presence. Analyze the public profile, choose projects worth showcasing, generate a tailored profile README, and explore GitHub achievement opportunities — without inventing a contribution history.

**Status:** v0.3.0 prototype. Public audit and draft generation are read-only. A separate, explicitly approved `apply` command can publish a reviewed profile README to GitHub. Historical contribution diagnostics are still planned.

## Why GH Aura?

A recruiter might spend less than a minute on your profile. GH Aura focuses on helping visitors identify your specialization, the projects you can demonstrate, and the evidence behind your claims.

No dashboard. No web UI. No mandatory account registration. Just terminal commands and a JSON configuration file.

## Three styles

| Style | Presentation | Defaults |
| --- | --- | --- |
| **`minimal`** | Reserved, clean, professional | Short intro, selected work, relevant links |
| **`regular`** | More structured, still restrained | About, featured-project table, repository languages, links |
| **`flashy`** | Visual showcase | Centered intro, technology badges, detailed projects, live-at-generation repo stats |

Every style supports the same explicit configuration, so sections can be enabled or disabled individually. `flashy` includes images from shields.io: this shares requested badge image URLs with that third-party service when readers open the README.

## Quick start

Requires **Node.js 22+**. There are **zero runtime dependencies**.

```bash
git clone https://github.com/ibbuilds/gh-aura.git
cd gh-aura

node src/cli.mjs --help
node src/cli.mjs init
node src/cli.mjs audit ibbuilds
node src/cli.mjs plan ibbuilds
node src/cli.mjs showcase ibbuilds --goal "backend engineer" --inspect 6
node src/cli.mjs profile ibbuilds --style minimal --output profile-preview.md
node src/cli.mjs diff ibbuilds --style minimal
node src/cli.mjs brief ibbuilds --output editorial-brief.json
node src/cli.mjs achievements
```

From a local checkout, you can also run `npm link` to use `gh-aura` as a command. The package has **not** been published to npm.

## Commands

| Command | Output | Requires write access to GitHub? |
| --- | --- | --- |
| `gh-aura init` | Local `.gh-aura.json` starter config | No |
| `gh-aura audit USER` | Evidence-based profile findings, Markdown or JSON | No |
| `gh-aura plan USER` | Prioritized improvements and showcase candidates | No |
| `gh-aura showcase USER` | Up to six explained public-repository recommendations | No |
| `gh-aura profile USER --style minimal` | Local draft profile README in one of three styles | No |
| `gh-aura diff USER` | Terminal diff against a generated README | No |
| `gh-aura brief USER` | Vendor-neutral JSON for AI-assisted or manual copywriting | No |
| `gh-aura preview USER --file draft.md` | Diff + approval code bound to the draft and remote README | No |
| `gh-aura apply USER --file draft.md --approve SHA256` | Publish only the exact, previously reviewed draft | **Yes, with explicit approval** |
| `gh-aura config show/get/set/reset` | Inspect or change local settings by command | No |
| `gh-aura achievements` | Offline catalog of reported possible and historical achievements | No |

Use `--inspect 6` to inspect the top six candidate project READMEs for conventional setup and usage headings (0–20); it consumes extra GitHub API requests and is not a source-code quality review. The default is 0 to conserve rate limits.

Use `--output filename` to write a local file; default is stdout. Existing local files are not overwritten unless you pass `--force`. Use `--format json` or `--json` for supported structured reports.

**This version does not update profile pins automatically.** GitHub offers a profile UI to choose up to six pinned repositories or gists. GH Aura produces a shortlist and explanations for you to review.

## Configurable by design

Run `gh-aura init` to generate a complete local configuration. All settings are optional; this abbreviated example shows core customization:

```json
{
  "profile": {
    "style": "minimal",
    "name": "",
    "headline": "Software engineer building reliable tools",
    "about": "",
    "technologies": [],
    "featured": ["ibbuilds/gh-aura"],
    "excluded": [],
    "maxProjects": 3,
    "sections": {
      "about": true,
      "projects": true,
      "technologies": false,
      "links": true,
      "stats": false,
      "extras": true
    },
    "links": [
      { "label": "Portfolio", "url": "https://example.com" }
    ],
    "extras": [],
    "accent": "blue"
  },
  "showcase": {
    "goal": "software engineer",
    "topics": ["typescript", "automation"],
    "preferred": ["ibbuilds/gh-aura"],
    "excluded": [],
    "limit": 6,
    "weights": {
      "relevance": 30,
      "substance": 25,
      "presentation": 20,
      "maintenance": 15,
      "popularity": 10
    }
  }
}
```

The full generated config also includes `scan.maxRepos` (default 200, maximum 500) and `scan.inspectRepos` (default 0, maximum 20). The ranking is a **preliminary metadata heuristic**, not a code-quality or hiring prediction. It can favor strong zero-star projects over irrelevant popular forks; user-selected projects always stay under your control.

Use `--config path/to/config.json` to choose another configuration. `--style`, `--goal` and `--limit` override the corresponding settings for a command.

## GitHub credentials and privacy

Unauthenticated audits read public data and are subject to GitHub API limits. An optional `GH_TOKEN` or `GITHUB_TOKEN` can be provided in your environment for read access; never put tokens into configuration files or commits.

```bash
GH_TOKEN=your_token_here node src/cli.mjs audit yourname --format json
```

A token is **not required** to use the public-profile commands. Only an explicit `apply` command can modify the public `username/username` profile README repository. All other commands are read-only or edit a local configuration file.

## Command-driven customization

No configuration file editor is required:

```bash
gh-aura config show
gh-aura config get profile.style
gh-aura config set profile.style minimal
gh-aura config set profile.sections.stats false
gh-aura config set profile.technologies '["TypeScript","Python"]'
gh-aura config set showcase.weights.popularity 5 --dry-run
gh-aura config reset profile.sections.stats
```

All `config set` and `config reset` commands modify **only your local** `.gh-aura.json`, with schema validation. Pass `--dry-run` to review the change without saving it, or `--config path` to target a separate local file.

## Explicit preview and apply

A profile update requires three distinct commands. GH Aura **never publishes a generated draft automatically**.

```bash
# 1. Generate or edit a Markdown draft.
gh-aura profile ibbuilds --style minimal --output draft.md

# 2. Inspect the exact draft against the current README.
gh-aura preview ibbuilds --file draft.md

# 3. Only if you approve: copy the code printed by preview.
# A GitHub token with contents:write to ibbuilds/ibbuilds is required.
GH_TOKEN=... gh-aura apply ibbuilds --file draft.md --approve SHA256_FROM_PREVIEW
```

The approval code is bound to the username, target path, current README content and revision, and exact draft bytes. If the draft or remote README changes, the code becomes invalid. The GitHub Contents API also checks the current file SHA to reject concurrent updates. `apply` updates **only** the profile README, not other repository files, pins, commits or account settings. Existing README content is not merged automatically; you must review the full diff.

If the profile repository does not exist, create the public `username/username` repository manually before using preview/apply.

## AI without vendor lock-in

`gh-aura brief USER --output brief.json` exports a structured brief with public evidence, style preferences and editorial constraints. Give that JSON to any AI assistant, or write your draft yourself. Save the proposed README as a Markdown file, then use the same `preview` and `apply` commands.

GH Aura does not send prompts to an AI vendor, require an AI API key, or give an AI service your GitHub credentials. The exported brief is optional, and the user remains the editor and publisher.

## Achievements and contribution history

GH Aura's achievement catalog distinguishes community-reported available achievements from historical ones. GitHub makes the final award decisions; thresholds and award behavior can change. The tool cannot guarantee a badge or verify that an account earned one.

For contributions, the planned diagnostics will focus on *real work* that may be missing due to email attribution, branch eligibility, fork behavior, or private-contribution visibility. It will not backdate commits, manufacture activity, or rewrite history to depict work that did not occur.

- [Roadmap and acceptance criteria](docs/PRODUCT_PLAN.md)
- [Architecture, CLI, and permissions](docs/ARCHITECTURE.md)
- [Official GitHub contribution reference](https://docs.github.com/en/account-and-profile/reference/profile-contributions-reference)
- [How to pin repositories](https://docs.github.com/en/account-and-profile/how-tos/profile-customization/pinning-items-to-your-profile)

## Development

```bash
npm run check
npm test
```

Licensed under MIT. Contributions should be meaningful, reviewable and attributed accurately.
