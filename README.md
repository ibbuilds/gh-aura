# GH Aura

**Make your GitHub work impossible to overlook.**

A CLI-only tool for shaping a clear, professional GitHub presence. Analyze the public profile, choose projects worth showcasing, generate a tailored profile README, and explore GitHub achievement opportunities — without inventing a contribution history.

**Status:** v0.2.0 prototype. Read-only GitHub API access; generated files stay local. Historical contribution diagnostics and GitHub write/apply commands are *not yet implemented*.

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
| `gh-aura diff USER` | Terminal diff against existing public profile README | No |
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

A token is **not required** to use the public-profile commands. This prototype does not modify any remote GitHub profile or repository.

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
