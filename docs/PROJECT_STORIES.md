# Personal project stories

A developer can now explicitly describe **their own contribution** to selected repositories. This is more useful in a hiring conversation than a grid of badges or just a project's language.

## Set a project story locally

```bash
gh-aura config set profile.featured '["YOUR_USERNAME/backend-toolkit"]'

# JSON contains what you personally know and can explain.
gh-aura config set profile.projectStories '[
  {
    "repo": "YOUR_USERNAME/backend-toolkit",
    "problem": "We needed a reliable API client for internal tooling.",
    "contribution": "I built pagination and error handling with integration tests.",
    "tradeoffs": "Used bounded retries to avoid uncontrollable network loops.",
    "outcome": "Used by our team for release automation.",
    "proof": "https://github.com/YOUR_USERNAME/backend-toolkit/tree/main/src"
  }
]'
```

The example is **fictitious**; replace it with your real work. No fields are inferred from others' repositories and the tool does not certify a user claim.

Fields: `repo` (required repo name/full name), and one or more of `problem`, `contribution`, `tradeoffs`, `outcome`, `proof`. A proof must be a safe HTTPS link. At most 12 stories may be stored; only explicitly selected showcase repositories are rendered.

## Presentation

```bash
gh-aura profile --style minimal --output minimal.md
gh-aura profile --style regular --output regular.md
gh-aura profile --style flashy --output flashy.md
```

- **Minimal**: a one-line contribution and optional inspectable link beside each project.
- **Regular**: a concise table with the problem, contribution and optional proof/trade-off details.
- **Flashy**: structured sections for the problem, your implementation, trade-offs, outcome and evidence.

All three use the same facts, not different invented careers or inflated credentials. Explicit section and project preferences still win. If a project isn't selected for the README, its stored notes are not displayed.

## Optional external writing

```bash
gh-aura brief --prompt --output writer.txt
```

The editorial brief includes these notes with the explicit provenance `user-supplied-not-independently-verified`. An AI/editor may rephrase them but must not add unprovided employment, skills, impact numbers or projects. The user must review the output, including every claim, before approving publication.

## Review and publish

```bash
gh-aura check --file minimal.md
gh-aura preview --file minimal.md --save review.json
# Only after reading the complete diff:
gh-aura apply --review review.json --pr
```

The existing hash-bound approval protects the remote README and does not publish automatically. No change to issue/PR graphs, other repos, private activity or GitHub achievements is caused by recording a story.

## Privacy

Do not place confidential client code, private company secrets, unreleased commercial metrics or non-consented names into the configuration. The profile README is public. Private work can be summarized truthfully without publishing proprietary details.
