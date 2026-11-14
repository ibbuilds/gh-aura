# GH Aura

**Improve your GitHub profile with your preferred AI or the standalone CLI.**

GH Aura combines original READMEs, biography, relevant public projects, achievements and contribution-calendar tools to communicate your actual work in your chosen style.

Your request selects from 100 unique profile references balanced across eight styles. Your AI inspects the selected profiles, then creates an original design for you.

**Node.js 22+ · Free · Zero runtime dependencies · Local-first**

## Install

Download the [latest GitHub Release](https://github.com/ibbuilds/gh-aura/releases/latest), or:

    git clone https://github.com/ibbuilds/gh-aura.git
    cd gh-aura
    npm link
    gh-aura init USERNAME

## Use with your AI

Install the [Agent Skill](skills/gh-aura-profile/SKILL.md), and connect a compatible MCP client to **gh-aura mcp**:

    gh-aura agent install --client codex
    gh-aura agent doctor --json
    gh-aura brief --prompt --direction technical --output prompt.md

Your AI can inspect evidence, preserve your style and project choices, compose an original draft and preview the complete change plan. Tools read by default. An owner-configured host grant permits execution of one exact reviewed plan; the model cannot authorize itself.

## Use the CLI directly

    gh-aura readme minimal --output draft.md
    gh-aura agent bio --voice technical --bio-words 70
    gh-aura pins --goal "backend engineer"
    gh-aura badges free
    gh-aura activity 2022

The workflow updates bio (160 characters), account fields, README and owned assets. Public scans declare coverage and prepare six pins; pinning uses GitHub's UI. Activity/Badges share a marked private workspace. GitHub determines attribution and awards.

## Review the complete profile

    gh-aura improve spec --output profile.json
    gh-aura improve draft USERNAME --spec profile.json --output draft.md
    gh-aura improve check USERNAME --spec profile.json --file draft.md --resources
    gh-aura improve plan USERNAME --spec profile.json --file draft.md --output plan.json
    gh-aura improve preview --review plan.json

The owner edits the spec and reviews the fingerprint before `improve apply` or a host grant. Default delivery opens an unmerged PR. [Full workflow and workspace setup](https://github.com/ibbuilds/gh-aura/blob/main/docs/IMPROVE.md).

## Product direction and evidence

Use `gh-aura sources categories`, then `sources profiles --category STYLE` to browse references. [Workflow](https://github.com/ibbuilds/gh-aura/blob/main/docs/PRODUCT_PLAN.md) · [Original demos](https://github.com/ibbuilds/gh-aura/tree/main/examples) · [Historical research](https://github.com/ibbuilds/gh-aura/tree/d978bbae0234b30390885fc17bb7f2b6d52bc21b/research).

[CLI and MCP setup](https://github.com/ibbuilds/gh-aura/blob/main/docs/CLI.md) · [Security](SECURITY.md) · [Release gates](https://github.com/ibbuilds/gh-aura/blob/main/docs/RELEASE_READINESS.md)

MIT. No paid AI service or GitHub Pages required.
