# Hiring readiness: make real GitHub work easy to assess

## What this feature means

GH Aura optimizes a **first-minute scan** of a job seeker's GitHub profile, followed by deeper review of one or two projects. It **does not** estimate the probability of receiving an interview, grade someone's engineering seniority or prove that a recruiter will read the page.

Professional engineer reference profiles are inputs for *presentation patterns only*. The hiring-focused goal is different: show role-relevant, accessible and verifiable proof of the candidate's **own** work.

GitHub's official guide recommends choosing 3–5 relevant projects and making a project understandable in a brief evaluation window: https://docs.github.com/en/account-and-profile/tutorials/using-your-github-profile-to-enhance-your-resume

## One direct command

After setting the username once:

```bash
gh-aura init YOUR_USERNAME

# Set the role for which the portfolio will be reviewed
gh-aura config set editorial.targetRole "Backend engineer"

# Read-only audit with selected repository README inspections
gh-aura audit --inspect 3

# Override the target role for one run without editing configuration
gh-aura audit --goal "Platform engineer" --inspect 3

# Structured findings for tools and scripts
gh-aura audit --inspect 3 --json --output report.json
```

The normal audit includes a **first-minute hiring-manager review** and remains read-only. This uses existing public GitHub data and the optional README inspection budget; it does not scan other engineers' profiles or invoke a paid service.

## Questions it checks

| Question | Current evidence | Important boundary |
| --- | --- | --- |
| Which engineering role is this profile intended for? | Explicit configured target role | Aspiration, not an existing job title |
| Can visitors identify the developer's focus? | Public bio, user-supplied headline or about | No guarantee the copy is professionally convincing |
| Is there an accessible introduction? | Public username/username profile README | Contents are not automatically verified for accuracy |
| Are there 2–3 inspectable projects? | User-selected repositories or explained suggestions | Selected repositories are not necessarily the current GitHub pins |
| Can projects be approached quickly? | Optional README presence and conventional setup/usage headings | Headings don't prove that commands work |
| Can a visitor contact the developer? | Public website or configured links | A link is not crawled or availability-checked |
| Do project descriptions align with the target role? | Conservative keyword matches on public descriptions/topics/languages | Metadata doesn't prove suitability, and missing keywords don't imply failure |
| Is engineering depth demonstrated? | **Unknown in this release** | No source execution, tests/CI verification, design review or personal-ownership confirmation |

Findings use **clear**, **needs-work**, and **unknown** states. “Unknown” is critical: private work, atypical README names and inaccessible data must not be scored as weak engineering ability. The report has no percentage called “hireability” or interview probability.

The report includes a small project-evidence table with observed documentation signals, links, and explicit unknowns for code correctness, tests, CI and individual ownership.

## What we should improve next

1. **Deep evidence on shortlisted projects.** Explicit `--inspect 2`–`--inspect 3` should optionally detect tests, CI workflows, runnable examples, architecture documentation, releases and dependencies, while reporting that detection is not execution or certification. Avoid pulling or analyzing all repositories by default. Respect existing API budgets and caching.
2. **Personal contribution statements.** Let a user attach short, manually confirmed “What I built / Why / Trade-offs / How to verify” metadata to a project. An owned repository alone does not prove that the account owner designed every part.
3. **Job-description comparison.** Accept a local plain-text job description and extract user-confirmed skill and problem-domain requirements. Explain matching project evidence, missing demonstrable signals and unknowns. Never invent claims to match a job.
4. **Editorial impact.** Make profiles reflect real ownership and role-relevant problem solving, while allowing minimal/regular/flashy output without copy-pasted biographies or fake metrics.
5. **Evaluation with people.** Run a small blinded, consent-based 60-second review with recruiters/technical interviewers comparing original and proposed profiles. Measure whether they correctly identify the role, strongest work, individual contribution and a reason to explore a project. Iterate from this feedback; no hiring-effect claim without real data.

These future capabilities are deliberately **not** advertised as implemented. The current review is still metadata/README based.

## What is not useful to optimize as a primary hiring signal

- Contribution graph green-square density or fake historical activity.
- Counts of badges, stars, followers and artificially created issues.
- Claiming current employment because a user has a company organization badge.
- Inferring expertise from language statistics or repository size.
- Copying a prominent engineer's terse profile when the candidate needs to show evidence.

Work done in private organizations may be substantive and unavailable for public demonstration. A user can describe such experience accurately without exposing confidential code. The tool should respect that distinction.

## Source context

- [GitHub's hiring-oriented profile guide](https://docs.github.com/en/account-and-profile/tutorials/using-your-github-profile-to-enhance-your-resume)
- [Holloway: early signals for technical hiring](https://www.holloway.com/g/technical-recruiting-hiring/sections/early-signals)
- [Professional engineer profile reference methodology](../research/INDUSTRY_STUDY.md)
