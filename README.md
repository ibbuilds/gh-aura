# GH Aura

Local GitHub CLI: inspect activity, explore achievements, draft a profile README and recommend projects to pin.

**Node.js 22+ · Free · No runtime dependencies**

## Install

[Latest release](https://github.com/ibbuilds/gh-aura/releases/latest) or run from source:

```bash
git clone https://github.com/ibbuilds/gh-aura.git
cd gh-aura
npm link
gh-aura init USERNAME
```

## Main commands

```bash
gh-aura activity 2022            # Read real contributions
gh-aura badges free              # Achievement opportunities
gh-aura readme minimal -o me.md  # Draft a profile README
gh-aura pins --goal "backend"    # Recommend public projects
```

## Optional private workspace

Activity and badge exercises reuse **one owned, GH Aura-marked private repo**, default `USERNAME/gh-aura-workspace`. No repo is created by `init`. Only fingerprint-approved `apply` commands write remotely.

```bash
gh-aura activity plan 2022 --density 70 --output activity.json
gh-aura badges auto --tier base --strategy git-batch --output badges.json
```

Review each JSON plan before applying it. Activity needs a verified author email; badges need a token with private repo/PR/issue access. GitHub decides whether synthetic practice appears on the graph or earns an achievement. **No badges are guaranteed.**

For an original README assisted by any AI (without rigid templates or an AI subscription):

```bash
gh-aura brief --prompt --direction technical --output prompt.md
# Directions: barebones, minimal, technical, expressive
```

You control sections, projects, links and visuals through `gh-aura config`. The AI only drafts text; GH Aura never sends your token to an AI provider.

To publish a real profile draft:

```bash
gh-aura preview --file me.md --save review.json
gh-aura apply --review review.json --pr
```

`--pr` opens an **unmerged** review PR. Project pins remain a manual GitHub choice.

Optional two-account access check: `GH_AURA_COLLAB_TOKEN` + `GH_TOKEN`, then `gh-aura badges auto accounts`. This checks access only; it does not grant achievements.

[Commands](docs/CLI.md) · [Activity](docs/ACTIVITY.md) · [Badges](docs/BADGE_RUN.md) · [Security](SECURITY.md) · [Verified scope](docs/PRODUCT_PLAN.md)

**Distribution:** only the [latest GitHub Release](https://github.com/ibbuilds/gh-aura/releases/latest) has downloadable assets; historical Git tags remain available. npm registry publication is not configured. MIT licensed.
