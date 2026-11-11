# GH Aura

**Make your GitHub work impossible to overlook.**

GH Aura is an open-source, evidence-first GitHub profile enhancer. Its purpose is to help developers present their work clearly, choose meaningful showcase projects, understand achievements, and make their real contribution history easier to discover.

> **Status:** Product planning / pre-alpha. The CLI and automation described below are planned, not implemented yet.

## The 60-second profile

A recruiter or hiring manager should quickly be able to answer:

1. Who is this developer, and what do they build?
2. What technologies and engineering strengths can they demonstrate?
3. Which projects best prove those capabilities?
4. How has their work evolved over time?
5. Where can I inspect code, documentation, demos, or releases?

GH Aura is designed around that one-minute review, not vanity metrics.

## Planned capabilities

| Capability | What it will do | Initial delivery |
| --- | --- | --- |
| Profile audit | Inspect public profile details, README, repository metadata, showcase, and explain gaps | MVP |
| Profile README studio | Generate concise, professional, customizable README drafts, with diff and preview | MVP |
| Showcase advisor | Recommend up to six repositories using job relevance, evidence, docs, maintenance, and popularity | MVP |
| Achievement navigator | Track documented achievement opportunities, limitations, eligibility, and verification | Next |
| Contribution audit | Explain actual contribution history and diagnose missing attribution or visibility | Next |
| Engineering timeline | Summarize **verifiable** milestones without rewriting Git history | Later |
| Profile maintenance | Periodically propose meaningful updates and report stale content | Later |
| Guided apply | Prepare reviewable changes with explicit user approval and minimum required permissions | Later |

## Product principles

- **Evidence over appearance:** Never invent experience, projects, endorsements, badges, or contribution history.
- **Professional, not flashy:** Minimal design, clear engineering story, accessible content.
- **Read-only first:** Audit without modification; preview every proposed change.
- **Transparent recommendations:** Always show why a repository, achievement, or edit is recommended.
- **No contribution farming:** No fake dates, meaningless commits, mass self-interactions, or dummy repositories just to paint the graph.
- **User in control:** The developer approves profile changes, featured projects, and any repository creation.

## Proposed CLI (not implemented)

```bash
gh-aura audit --user octocat
gh-aura plan --user octocat --goal "backend engineer"
gh-aura readme --user octocat --style minimal --output profile.md
gh-aura showcase --user octocat
gh-aura achievements --user octocat
gh-aura contributions --user octocat
```

The first release will be a local-first TypeScript CLI. A browser UI can follow after the audit and recommendation engine is reliable.

## Roadmap and design

- [Product plan and phase definitions](docs/PRODUCT_PLAN.md)
- [Technical architecture and data/permission boundaries](docs/ARCHITECTURE.md)

## Scope

GH Aura improves **how GitHub work is represented and discovered**. It is not a generic Git automation system, a bulk refactoring tool, a job-application bot, or a service that fabricates an activity graph.

GitHub supports a profile README through a public repository named after the account. GitHub's profile pins currently require a user-facing selection step; GH Aura will recommend pins rather than claim to edit them through a nonexistent public API.

## Privacy and safety

No credentials in source control. Public profiles can be audited without write access. Private repository analysis, authenticated APIs, AI-assisted writing, and write operations will be separately opt-in. Keep attribution and timestamps authentic.

## Project

**Repository:** https://github.com/ibbuilds/gh-aura

**Stage:** Planning. See [the product plan](docs/PRODUCT_PLAN.md) for implementation priorities and acceptance criteria.
