# Research archive

The original datasets, observations, eight user references, collectors and study tests are preserved at immutable commit [d978bbae0234b30390885fc17bb7f2b6d52bc21b](https://github.com/ibbuilds/gh-aura/tree/d978bbae0234b30390885fc17bb7f2b6d52bc21b/research).

The active product keeps compact runtime references in src/. The archive records 600 candidates, 562 four-view renders and **zero final editorial approvals**. A subsequent [500-profile AI source study](../docs/PROFILE_SOURCE_STUDY.md) now supplies eight abstract composition principles; its individual corpus remains outside the product. Source-informed guidance is distinct from full-profile certification.

Run **npm run test:research** to export the local checkpoint temporarily, execute its study checks and verify current runtime citations. It needs Git and tar, performs no network calls and removes its export. A shallow clone missing the checkpoint must explicitly run:

    git fetch origin d978bbae0234b30390885fc17bb7f2b6d52bc21b

Research continuation, pattern extraction and acceptance are defined in the [product plan](../docs/PRODUCT_PLAN.md).

`npm run research:prepare` exports research inputs/code to a new OS temporary directory **outside the checkout**, omitting agent instructions, Skills and CI. It applies a recorded viewport-height correction, keeps the browser sandbox enabled, and installs the current strict editorial validator. `RESEARCH_CORRECTIONS.json` records each source/destination hash. This does not rewrite the checkpoint or preapprove reviews. Keep needed observations outside the product tree; retire the temporary copy after preserving useful evidence.

`npm run test:research:viewport` checks the original and repaired collectors against a local 390 × 844 browser fixture. Set `GH_AURA_CHROME` to an existing Chrome/Edge/Chromium executable; nothing is downloaded. It makes no GitHub requests and stores no screenshots. The original filter misses a broken image at y=600; the correction detects it.

`gh-aura sources audit --catalog PATH/reviews.json --limit 20` summarizes incomplete facets, editorial checks, category coverage and missing approved pattern references. It does not conduct reviews. An agent can read the same compact report only when the owner selects `GH_AURA_EDITORIAL_FILE` locally, through `gh_aura_editorial_progress`; raw notes and arbitrary model-selected file paths are not exposed.

The corrected 2026-11-13 re-observation attempted all 600 candidates: 562 complete four-view captures, 38 unavailable and 100 profiles with visible broken-image warnings. All 562 confirmed viewport widths and light/dark background changes. Results, hashes, the editorial queue and source-study corpus remain outside the product; [issue #69](https://github.com/ibbuilds/gh-aura/issues/69) tracks evidence. Historical categories are provisional. Neither automated captures nor AI source analyses assert completed full-profile certifications.
