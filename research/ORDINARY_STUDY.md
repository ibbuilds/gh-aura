# Ordinary-visibility engineer profile reference — 200 GitHub accounts

**Observed:** 2026-11-12 05:56 UTC  
**Dataset:** [ordinary-engineers-200.json](ordinary-engineers-200.json)  
**Collector:** [research-working-engineers.mjs](../scripts/research-working-engineers.mjs)

## Why this sample exists

GH Aura's primary editorial reference is now the **structure of profiles belonging to ordinary-visibility engineering accounts**, not celebrity maintainers or arbitrary contributors to fashionable projects.

The 200 public accounts were selected from company GitHub organizations with three simultaneous public signals: publicly visible organization membership, a matching *self-reported* company field, and an engineering-related role in the account's own bio. A cap of **2,000 visible followers** reduces the proportion of especially high-profile accounts. It is an **arbitrary visibility proxy**, not a measure of skill, competence or employment status.

The observations were collected in a **one-time, explicitly initiated** research workflow. Routine GH Aura commands do not search or load the dataset and generate no API calls for the reference cohort.

## Sampling and API budget

| Measure | Observation |
| --- | ---: |
| Public-company GitHub organizations queried | 41 |
| Distinct public member candidates | 2,094 |
| Individual accounts checked | 1,040 |
| Accounts with the three affiliation/role signals | 205 |
| High-visibility exclusions (over 2,000 followers) | 2 |
| Final selected sample | **200** |
| Organizations represented in sample | **35** |
| Actual GitHub API HTTP requests | **145** |

The sample used round-robin candidates from the first 100 publicly listed members of each organization, with no more than **15 selected accounts per employer group**. GitHub GraphQL batches fetch ten public profiles at a time. The collector refuses partial sample publication and enforces a **190-request hard ceiling**, 3 MiB response cap and stop-on-error behavior.

**Reproducibility:** Public memberships and claimed employers may change, so rerunning the collector later will not necessarily reproduce the identical selection. The exact dated source list and its Git blob hash are retained.

## What the 200 profile structures show

| Observation | Accounts |
| --- | ---: |
| At least one public pinned repository | 157 / 200 |
| Median public pins, including zero | 4 |
| Public website configured | 120 / 200 |
| Root profile README found at `HEAD:README.md` | 69 / 200 |
| Median approximate words in detected READMEs | 54 |
| Detected README with outbound links | 57 / 69 |
| Detected README without images | 33 / 69 |
| Detected README with GitHub-stat cards | 7 / 69 |

The **100% bio presence is a sampling artifact**: engineering-related text in the bio was required to enter the cohort. It does not show that every effective engineer or GitHub job seeker needs a bio.

Followers bands for the selected profiles:

| Public followers | Accounts |
| --- | ---: |
| 0–99 | 133 |
| 100–499 | 46 |
| 500–2,000 | 21 |

These figures describe visible account presentation, **not which profile styles lead to interviews**.

## Evidence strength and limits

- **Not 200 independently employer-verified staff members.** Public company GitHub organizations can include external collaborators, contractors and alumni. Employer and engineering role are self-reported and may be outdated.
- The study samples public members and people with recognized engineering words in their bios; engineers with private organization memberships, private commercial projects or differently worded bios may be underrepresented.
- Root-profile README inspection examined only `HEAD:README.md` in `LOGIN/LOGIN`; other possible README paths were not probed. Missing root README **does not imply** a poorly prepared profile.
- Followers over 2,000 were excluded by a fixed threshold to reduce concentration in high-visibility accounts, not because these engineers were low quality.
- No technical proficiency, seniority, hiring outcome, personal identity or employment contract was verified.
- No biography wording, README prose, source code, email, photographs or private repository details were retained. Public handles, observable file structure, counts, SHA hashes and source URLs were recorded.
- Separate [16 employer-source examples](employer-sourced.json) have dated employer-owned engineering author-page references; those sources may become stale. This cohort is preserved as a distinct stronger **published-affiliation** signal, not merged into the 200 accounts.

## Product decisions

Use the cohort for **presentation structure only**: a short technical focus, a few inspectable, relevant repositories, clear project ownership statements and authentic links. Do not make a copywriting library of other people's biographies or infer skills from aesthetics, green squares or follower counts.

A candidate with little public professional history may need **more context** than an established engineer who can rely on prior reputation; copying a terse staff engineer profile can be counterproductive. GH Aura keeps minimal, regular and flashy styles, but prioritizes the user's own evidence.

This is not a replacement for human usability feedback. The [60-second reviewer protocol](../docs/HUMAN_VALIDATION.md) still needs consenting participants and measured comprehension results before employment-outcome claims can be made.

## Sources

- [GitHub account/org membership documentation](https://docs.github.com/en/rest/orgs/members)
- [GitHub's job-seeking profile guidance](https://docs.github.com/en/account-and-profile/tutorials/using-your-github-profile-to-enhance-your-resume)
- [Detailed professional-engineer study history](INDUSTRY_STUDY.md)

Research is free within the repository's permitted public GitHub API limits; it does not require a paid profile tool or AI model.
