# GH Aura v1.16.0

**Flexible AI art direction and optional dual-account access checks.**

- `gh-aura brief --prompt --direction barebones|minimal|technical|expressive` generates model-agnostic writing guidance grounded in real repository data and user-selected sections. These are **creative directions**, not rigid or copied README templates.
- Use `gh-aura config set editorial.direction technical` to save a preference; other choices (projects, words, links, visuals, language) remain independent.
- `gh-aura badges auto accounts` checks two distinct local credentials (`GH_TOKEN` and `GH_AURA_COLLAB_TOKEN`) have **read access** to the same owned marked private workspace, with no writes or token storage.
- No automatic coauthor attribution, accepted-answer manipulation or additional achievement award is claimed. GitHub remains authoritative.
- Tests, concise docs and the four shipped modules remain intact.

[Commands](CLI.md) · [Badges](BADGE_RUN.md) · [Product status](PRODUCT_PLAN.md)
