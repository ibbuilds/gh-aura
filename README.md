# GH Aura

**Improve your GitHub profile with your preferred AI or the standalone CLI.**

GH Aura brings together original README composition, biography guidance, relevant public projects, achievement eligibility and contribution-calendar tools. The goal is a coherent profile that communicates your actual work in your chosen style.

**Node.js 22+ · Free · Zero runtime dependencies · Local-first**

## Install

Download the [latest GitHub Release](https://github.com/ibbuilds/gh-aura/releases/latest), or:

    git clone https://github.com/ibbuilds/gh-aura.git
    cd gh-aura
    npm link
    gh-aura init USERNAME

## Use with your AI

Connect a compatible MCP client to the local stdio command **gh-aura mcp**, or load the [portable Agent Skill](skills/gh-aura-profile/SKILL.md).

    gh-aura agent capabilities --json
    gh-aura brief --prompt --direction technical --output prompt.md
    gh-aura sources design --query "terminal retro" --json

Your AI can inspect public evidence, refine an editable profile specification, choose composition techniques, guide biography writing and validate an original draft. Current agent tools are read-only; full authorized execution is part of the delivery plan.

## Use the CLI directly

    gh-aura readme minimal --output draft.md
    gh-aura agent bio --voice technical --bio-words 70
    gh-aura pins --goal "backend engineer"
    gh-aura badges free
    gh-aura activity 2022

Bio guidance currently targets prose; updating the account's sidebar bio is pending. Pins are recommendations. Optional synthetic Activity/Badges exercises use one owned, marked private workspace and separately reviewed plans; GitHub determines contribution attribution and awards.

## Review and publish a README

    gh-aura check --file draft.md --professional --goal hiring
    gh-aura preview --file draft.md --save review.json
    gh-aura apply --review review.json --pr

The owner independently reviews and executes publication. A PR remains unmerged.

## Product direction and evidence

The [detailed delivery plan](https://github.com/ibbuilds/gh-aura/blob/main/docs/PRODUCT_PLAN.md) defines the complete profile journey, remaining work, dependencies and acceptance criteria. Historical research is [preserved at an immutable checkpoint](https://github.com/ibbuilds/gh-aura/tree/d978bbae0234b30390885fc17bb7f2b6d52bc21b/research); provisional examples are reading references, not certified winners or templates.

[CLI and MCP setup](https://github.com/ibbuilds/gh-aura/blob/main/docs/CLI.md) · [Security](SECURITY.md) · [Release gates](https://github.com/ibbuilds/gh-aura/blob/main/docs/RELEASE_READINESS.md)

MIT. No paid AI service or GitHub Pages required.
