# Research archive

The original datasets, observations, eight user references, collectors and study tests are preserved at immutable commit [d978bbae0234b30390885fc17bb7f2b6d52bc21b](https://github.com/ibbuilds/gh-aura/tree/d978bbae0234b30390885fc17bb7f2b6d52bc21b/research).

The active product keeps compact runtime references in src/. The archive records 600 candidates, 562 four-view renders and **zero final editorial approvals**.

Run **npm run test:research** to export the local checkpoint temporarily, execute its study checks and verify current runtime citations. It needs Git and tar, performs no network calls and removes its export. A shallow clone missing the checkpoint must explicitly run:

    git fetch origin d978bbae0234b30390885fc17bb7f2b6d52bc21b

Research continuation, pattern extraction and acceptance are defined in the [product plan](../docs/PRODUCT_PLAN.md).

`npm run research:prepare` exports a working copy to a new OS temporary directory **outside the checkout**. It applies a recorded viewport-height correction to the archived image filter, keeps the browser sandbox enabled, and installs the current strict editorial validator. `RESEARCH_CORRECTIONS.json` records each source/destination hash. This does not rewrite the checkpoint or preapprove any review. Keep needed observations outside the product tree; retire the temporary copy after preserving its useful evidence.

`npm run test:research:viewport` checks the original and repaired collectors against a local 390 × 844 browser fixture. Set `GH_AURA_CHROME` to an existing Chrome/Edge/Chromium executable; nothing is downloaded. It makes no GitHub requests and stores no screenshots. The original filter misses a broken image at y=600; the correction detects it.

`gh-aura sources audit --catalog PATH/reviews.json --limit 20` summarizes incomplete facets, editorial checks, category coverage and missing approved pattern references. It does not conduct reviews. An agent can read the same compact report only when the owner selects `GH_AURA_EDITORIAL_FILE` locally, through `gh_aura_editorial_progress`; raw notes and arbitrary model-selected file paths are not exposed.
