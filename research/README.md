# Research archive

The original datasets, observations, eight user references, collectors and study tests are preserved at immutable commit [d978bbae0234b30390885fc17bb7f2b6d52bc21b](https://github.com/ibbuilds/gh-aura/tree/d978bbae0234b30390885fc17bb7f2b6d52bc21b/research).

The active product keeps compact runtime references in src/. The archive records 600 candidates, 562 four-view renders and **zero final editorial approvals**.

Run **npm run test:research** to export the local checkpoint temporarily, execute its study checks and verify current runtime citations. It needs Git and tar, performs no network calls and removes its export. A shallow clone missing the checkpoint must explicitly run:

    git fetch origin d978bbae0234b30390885fc17bb7f2b6d52bc21b

Research continuation, pattern extraction and acceptance are defined in the [product plan](../docs/PRODUCT_PLAN.md).
