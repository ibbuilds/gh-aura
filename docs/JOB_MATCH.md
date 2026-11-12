# Local job description matching

GH Aura has an optional **zero-cost, local-only** job-posting analysis for the existing profile audit.

## Quick start

Save the requirements or entire posting as plain UTF-8 text, then run:

```bash
gh-aura init YOUR_USERNAME
gh-aura audit --job vacancy.txt --deep 2
gh-aura audit --job vacancy.txt --json --output review.json
```

The job description is opened locally, validated and processed **before any GitHub API request**. Its full text is not included in the output, transmitted to GitHub, sent to an LLM or written to a cache. GH Aura makes the same public GitHub reads as a normal audit; `--deep 2` optionally inspects two public project file trees within the usual request budget.

## What the mapping actually means

1. Extract a transparent, bounded vocabulary of recognized technologies and engineering domains from the **user-provided job posting**.
2. Compare mentions with public **user-selected repositories**: name, language, description and topics. If no selection is configured, use the usual ranked showcase list.
3. Read the **user-supplied project stories** only for those selected repositories.
4. Classify evidence separately as `mentioned-in-public-metadata`, `user-claimed` or `not-observed-in-selected-projects`, with links.
5. Report which stated requirements need clearer evidence, without guessing whether the person knows the skill or is employable.

A word in a repository title or README is **not proof that code works, that the person wrote it or that the employer will consider them**. A personal contribution claim is not independently verified. Private/commercial experience and job requirements outside the limited vocabulary remain unknown.

The output **does not** provide a job match percentage, seniority ranking, automated application or hiring prediction.

## Practical use

For a backend posting listing PostgreSQL, Kubernetes and TypeScript, the report might identify TypeScript in a user-supplied contribution note, Kubernetes in public repository metadata, and no mention of PostgreSQL in the selected portfolio.

This means: explain the TypeScript contribution with evidence, verify the Kubernetes claim by examining code and do not assume missing PostgreSQL keywords imply lack of expertise. A candidate may be experienced in PostgreSQL entirely through confidential commercial work.

## Security and performance

- Input must be plain UTF-8 text, **1–65,536 bytes**; invalid UTF-8 or control characters are rejected.
- No job-posting content is sent with GitHub API requests; no new paid service or model provider.
- Job text is not persisted to local config, output or cache. No telemetry.
- The term detector uses curated aliases; it can miss terms, match negated requirements or mistake preferences for requirements.
- All publication remains behind `preview` and explicit reviewed `apply`; job comparison is read-only.

See [hiring readiness](HIRING_READINESS.md) and [project stories](PROJECT_STORIES.md).
