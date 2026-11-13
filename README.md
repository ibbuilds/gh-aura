# GH Aura

**Improve your GitHub profile with your preferred AI or the standalone CLI.**

GH Aura combines original READMEs, biography, relevant public projects, achievements and contribution-calendar tools to communicate your actual work in your chosen style.

**Node.js 22+ · Free · Zero runtime dependencies · Local-first**

## Install

Download the [latest GitHub Release](https://github.com/ibbuilds/gh-aura/releases/latest), or:

    git clone https://github.com/ibbuilds/gh-aura.git
    cd gh-aura
    npm link
    gh-aura init USERNAME

## Use with your AI

Install the [Agent Skill](skills/gh-aura-profile/SKILL.md), and connect a compatible MCP client to **gh-aura mcp**:

    gh-aura agent capabilities --json
    gh-aura agent install --client codex
    gh-aura agent doctor --json
    gh-aura brief --prompt --direction technical --output prompt.md
    gh-aura sources design --query "terminal retro" --json

Your AI can inspect evidence, preserve your style and project choices, compose an original draft and preview the complete change plan. Tools read by default. An owner-configured host grant permits execution of one exact reviewed plan; the model cannot authorize itself.

## Use the CLI directly

    gh-aura readme minimal --output draft.md
    gh-aura agent bio --voice technical --bio-words 70
    gh-aura pins --goal "backend engineer"
    gh-aura badges free
    gh-aura activity 2022

The shared workflow updates the actual sidebar bio (160 characters), selected account fields, README and owned assets. It scans public projects with explicit coverage and prepares up to six pins; GitHub's pin editor remains a manual step. Optional Activity/Badges use one marked private workspace. GitHub determines attribution and awards.

## Review the complete profile

    gh-aura improve spec --output profile.json
    gh-aura improve context USERNAME --spec profile.json
    gh-aura improve plan USERNAME --spec profile.json --file draft.md --output plan.json
    gh-aura improve preview --review plan.json

The owner edits the spec and reviews the fingerprint before `improve apply` or a host grant. Default delivery opens an unmerged PR. [Full workflow and workspace setup](https://github.com/ibbuilds/gh-aura/blob/main/docs/IMPROVE.md).

## Product direction and evidence

The [detailed delivery plan](https://github.com/ibbuilds/gh-aura/blob/main/docs/PRODUCT_PLAN.md) defines the complete profile journey, remaining work, dependencies and acceptance criteria. Historical research is [preserved at an immutable checkpoint](https://github.com/ibbuilds/gh-aura/tree/d978bbae0234b30390885fc17bb7f2b6d52bc21b/research); provisional examples are reading references, not certified winners or templates.

[CLI and MCP setup](https://github.com/ibbuilds/gh-aura/blob/main/docs/CLI.md) · [Security](SECURITY.md) · [Release gates](https://github.com/ibbuilds/gh-aura/blob/main/docs/RELEASE_READINESS.md)

MIT. No paid AI service or GitHub Pages required.
