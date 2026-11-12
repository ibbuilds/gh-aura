# 60-second hiring-manager usability study

**Status:** Protocol available. **No human review results have been collected.**

GH Aura can audit public evidence and generate profile drafts, but it cannot know whether a hiring manager actually understands the result or whether it increases interviews. That requires voluntary, consent-based human evaluation. Do not substitute engineer profile fame, follower counts or repository stars for these observations.

## Participants and consent

Target 6–12 participants with real technical recruiting, engineering interviewing or hiring-manager experience. Record self-reported role category and broad experience band, not names, emails, employer identities or individual contacts. Include a mix of developers (early career, career transition, experienced with private work) whose original and proposed profiles have been reviewed for confidentiality.

Recruit through the project's maintainers and networks with explicit opt-in. Provide a consent statement: "You will view a public or anonymized GitHub portfolio for three minutes and answer comprehension questions. Do not share the material. Participation is voluntary, you may stop at any point, and no personally identifying information is needed in the published results."

Do not share private repository content, private job histories, access tokens, or proprietary code. The profile owner approves what can be shown.

## Conditions and allocation

For each consenting profile owner, prepare two **frozen** snapshots:

- **A:** The original GitHub profile presentation.
- **B:** The GH Aura-assisted presentation after the owner has verified the content.

Freeze date, repository selection and role target. A profile's code and actual skills do not change between conditions. Do not tell reviewers which version GH Aura produced.

Prefer different randomly assigned reviewer groups for A and B to avoid memory/learning effects. If sample size forces a within-subject design, counterbalance version order and record it. Do not mix unmasked after-only aesthetics ratings with evidence-comprehension outcomes.

## Task 1 — First 60 seconds

Give the reviewer the account name, the target role as context and a public GitHub profile snapshot. After **60 seconds**, remove the snapshot. Ask, without letting the reviewer revisit it:

1. What kinds of software does this person build?
2. Which one or two projects would you inspect first? Give the exact names.
3. Can you identify something this person personally implemented, rather than something the repository merely contains?
4. Where could you inspect a demonstration, source evidence or running instructions?
5. Which statements are not independently supported or remain unclear?

Record free-text answers without editing their meaning. Mark **unknown** when a reviewer cannot determine a fact. Do not encourage guessing.

## Task 2 — Two-minute follow-up

Allow a two-minute review of **one** selected repository. Ask the reviewer to find:

- A concrete setup/example link, when present.
- A test/CI artifact or documented validation method, when inspectable.
- A meaningful engineering trade-off or contribution statement the account owner could explain in an interview.
- One technical follow-up question they would ask.

Record whether the link/claim was discoverable and what evidence was actually inspected, not whether the reviewer liked the colors.

## Scoring without fake "hireability"

For each reviewer and condition, record small objective comprehension metrics:

| Measure | Evidence |
| --- | --- |
| Role/focus understood | Reviewer identifies the declared target specialty without being prompted by copied boilerplate |
| Strong work found | Reviewer can name at least one relevant, real showcased project |
| Ownership distinguished | Reviewer knows whether personal contribution was verified, user-stated or unknown |
| Inspectable proof found | Reviewer identifies a valid code/demo/setup/test link |
| Uncertainty recognized | Reviewer can say what remains unknown, rather than assume claims are verified |

Use 0/1 per question only when an independent reviewer can reconcile it against the approved source evidence; otherwise mark **unclear**. Do not combine these into an individual's quality ranking or job-offer probability. Report sample size and raw counts for each condition, along with reviewer category and limitations. Small pilot results are not proof of causal hiring impact.

## Privacy and data record

A single row per consenting reviewer/condition may contain only:

- Randomized reviewer ID and **role category** (no employer, email or identifying details).
- Randomized profile study ID, condition A/B and assignment order.
- Target role category.
- The five comprehension marks (true, false, unknown).
- Optional redacted free-text confusion notes.
- Date and snapshot version.

Store local data in a separate consent-managed folder, **not** in the GitHub repository. Publish aggregated anonymized results only when participants agree. No telemetry or hidden recording is built into GH Aura.

## Completion gate for issue #21

Issue #21 can only be closed when real consenting reviewers have completed the protocol and a redacted, source-checked summary exists. GH Aura code tests and a study plan are **not substitutes** for participant results.

Until then, report the claims honestly: "GH Aura was tested for correctness and usability of CLI commands; its impact on real hiring decisions has not been established."

## Checklist for organizers

- Obtain explicit consent from profile owners and reviewers.
- Freeze accessible anonymized A/B snapshots; record source revisions.
- Randomize reviewers and hold the 60-second time limit.
- Collect responses with the same questions for both versions.
- Reconcile answers against real documented project evidence.
- Redact names and sensitive details before sharing aggregate findings.
- Identify specific usability failures and update GH Aura accordingly.
