# Research

GH Aura uses versioned, **offline** structural references to inform profile presentation. Research is never collected in normal CLI use, and **no biography or README prose is copied**.

- [100 verified public profile README examples](PROFILE_REFERENCES.md) · [structured reference bank](profile-design-references.json) (8 user supplied + 4 earlier + 88 newly checked; **all pending approval**, no copied assets).
- [Primary reference: 200 ordinary-visibility engineer profiles](ORDINARY_STUDY.md) · [structured data](ordinary-engineers-200.json).
- [Historical professional affiliation baseline (100) and employer-source examples (16)](INDUSTRY_STUDY.md) · [100-account dataset](company-profiles.json) · [16-account observations](employer-observations.json) · [source roster](employer-sourced.json).

Company membership and self-described roles are public affiliation signals, **not independent confirmation of employment**. The research did not measure interview outcomes.

The initial contributor-to-popular-projects baseline (not an employment cohort) was removed from the current tree during cleanup. Its history remains available through older Git tags and commits; old downloadable releases are intentionally pruned.

The developer-only collector scripts live in `scripts/research-*.mjs`. They must be run intentionally with a GitHub read token and bounded quotas; the installed CLI does not include them or run them in the background.
