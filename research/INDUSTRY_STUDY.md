# Professional engineering profile study (historical baseline)

**Current primary reference:** [200 ordinary-visibility engineer accounts](ORDINARY_STUDY.md). This document retains the older 100-account baseline and separately employer-sourced examples for provenance; its counts are historical, not the runtime primary cohort.

**Date:** 2026-11-11  
**Purpose:** Study how PEOPLE associated with professional software engineering present their GitHub work. The prior project-contributor baseline is kept for historical reproducibility, but is **not** the professional reference used by the writer.

## Two different levels of evidence

| Cohort | Profiles | Employers | Evidence | What it cannot prove |
| --- | ---: | ---: | --- | --- |
| Public company-affiliated engineering accounts | 100 | 21 represented | Public org membership AND matching self-listed company AND self-described engineering role | Individual current employment, payroll, seniority, competence |
| Employer-sourced engineering author accounts | 16 | 2 | Company-owned engineering author/staff pages with account linkage or independently corroborated identity | Whether a published role remains current, HR verification, competence |

The second category is backed by employer-owned pages rather than merely OSS project participation. It still does not grant us access to HR records. One Microsoft engineer's account identity is matched by a public professional GitHub self-description instead of a direct outbound employer link; the roster records this weaker link transparently.

**Never assert that all 100 company-associated profiles are currently employed by the named firms.** A company organization can include contractors and open-source collaborators. GitHub profile company and role fields are self-reported and can be stale.

## Public company-affiliation cohort

Dataset: [company-profiles.json](company-profiles.json).

Twenty-four public company-organization member listings were checked. Profiles were selected with three public signals: visible membership in a named company GitHub organization, a matching company field, and an engineering-related role mentioned in the person's bio. Prior-employer indicators were excluded heuristically. Accounts were considered round-robin across companies and capped at 12 per company and 100 total. Companies represented include GitHub, Microsoft, Google, Netflix, Shopify, Cloudflare, Stripe, Uber, Vercel, NVIDIA and others.

- 1,194 unique public members became candidates.
- 497 individual profiles were examined, producing 100 selected records.
- 21 company organizations appear among those 100 records.
- The completed collection used 74 GitHub API calls: 24 public REST listings and 50 authenticated GraphQL batch reads. Debugging runs are not included in that count.
- Public profile structural observations only; no biographies, emails, photographs, README prose or private data retained.

### Observed presentation

| Structural feature | Result |
| --- | ---: |
| Public profile had a bio | 100/100 (selection requires a role description) |
| Website configured | 59/100 |
| One or more public pinned repositories | 75/100 |
| Median pinned count, zeros included | 4 |
| Root profile README observed at HEAD:README.md | 38/100 |
| Median approximate words in those observed READMEs | 41 |
| Observed READMEs without detected images | 20/38 |
| Observed READMEs with links | 28/38 |
| Observed READMEs with detected stat widgets | 3/38 |

**Important:** Bio presence is **100% by construction** because an engineering role is a selection criterion. It cannot be used to claim every professional engineer supplies a bio.

## Employer-sourced cohort

Sources/roles: [employer-sourced.json](employer-sourced.json).  
Read-only structural observations: [employer-observations.json](employer-observations.json).

A deliberately curated list links publicly accessible GitHub accounts with role descriptions in company-owned engineering author pages. The list currently consists of 14 GitHub-associated engineers and 2 Microsoft-associated engineers, with dated reference pages and explicit linkage strength. Sources such as the [GitHub engineering blog](https://github.blog/engineering/) and [Microsoft developer blogs](https://devblogs.microsoft.com/) are employer-controlled publications, not scraped biographies.

- 16 of 16 profiles were publicly accessible at observation time.
- Two authenticated GraphQL batch requests collected their public structural details.
- 12/16 had at least one public pinned repository.
- 7/16 had a root README detected in the tested path.
- Median approximate length among the seven READMEs: 43 words.
- Five of those seven contained detected links and two contained no detected images.

**The employer-sourced cohort is small and heavily concentrated in GitHub.** It is not a basis for universal prescriptions or for comparing companies' employees. An author page may continue displaying an older employer assertion after someone changes jobs; we store its year, source and review date.

## What GH Aura learns

Use these observations as **structural references**, not as a library of sentences to recycle:

- Surface real work: make the purpose, inspectable repository and user's actual contribution identifiable quickly.
- Select a few projects worth examining; professional relevance and explainability matter more than stars alone.
- Keep the introduction concise, but let an early-career developer provide more context than a recognizable maintainer with an established reputation.
- Allow visual presentation levels from restrained to expressive; lack of flashy images is not a deficiency, and image-heavy READMEs are not automatically bad.
- Support links, demos and readable project instructions when real evidence exists.
- Keep target company/role as **aspirations**, not fabricated employment or seniority.

This is an editorial policy supported by GitHub's [hiring-oriented profile guidance](https://docs.github.com/en/account-and-profile/tutorials/using-your-github-profile-to-enhance-your-resume), NOT a statistically validated interview-outcome model.

## Data quality and provenance

- **No copied bios or READMEs:** only counts, presence flags, SHA-256 source hashes, GitHub handles and public links.
- GitHub's public member endpoint lists only memberships voluntarily shown by members; it does not certify an employment relationship. See the [GitHub documentation](https://docs.github.com/en/rest/orgs/members).
- The selected sample overrepresents people who disclose company AND engineering role publicly. Hidden members, employees who work on private code and contributors outside the selected organizations are systematically excluded.
- English role-keyword matching and simple Markdown/HTML detectors can miss legitimate information or match incorrectly.
- The researcher checked only the exact root README.md path; profile READMEs under other supported names/paths may be missed.
- The collector and full datasets are **excluded from the normal CLI package**. The runtime includes a compact aggregate and some public employer-source links, and makes **no calls to other engineers' profiles** when generating your own README.
- Every structural observation has a GitHub profile URL; employer-sourced records also include an independent company-owned source URL, publication year and review date.
- The sample contains **no hiring outcomes**, so it cannot establish which formatting choices increase interview odds.

## Reproduce deliberately

The two collectors are developer research scripts and must never run in the ordinary CLI flow:

    GH_TOKEN=... node scripts/research-industry-profiles.mjs
    GH_TOKEN=... node scripts/research-employer-sourced.mjs

Both use fixed API budgets and stop on permission/rate-limit errors. Research is a manual operation; there is no cron or background tracking of other people.

Reference data is meant to be periodically reevaluated for quality and source staleness, not silently treated as an eternal ground truth.
